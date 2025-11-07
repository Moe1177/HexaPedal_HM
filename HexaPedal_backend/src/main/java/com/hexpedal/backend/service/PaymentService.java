package com.hexpedal.backend.service;

import com.hexpedal.backend.model.*;
import com.hexpedal.backend.repository.PaymentMethodRepository;
import com.hexpedal.backend.repository.SubscriptionPlanRepository;
import com.hexpedal.backend.repository.UserRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentMethodRepository paymentMethodRepo;
    private final UserRepository userRepo;
    private final SubscriptionPlanRepository subscriptionPlanRepo;
    private final UserSubscriptionRepository userSubscriptionRepo;

    private String ensureStripeCustomer(User user) throws StripeException {
        if (user.getStripeCustomerId() != null) return user.getStripeCustomerId();
        Map<String, Object> params = new HashMap<>();
        params.put("email", user.getEmail());
        params.put("name", user.getFullName());
        com.stripe.model.Customer customer = com.stripe.model.Customer.create(params);
        user.setStripeCustomerId(customer.getId());
        userRepo.save(user);
        return customer.getId();
    }

    public PaymentMethod saveStripePaymentMethod(Long userId, String stripePaymentMethodId,
                                                 BillingAddress billingAddress, String cardholderName)
            throws Exception {

        User user = userRepo.findById(userId).orElseThrow();
        String customerId = ensureStripeCustomer(user);

        // Attach pm to customer
        Map<String, Object> attachParams = new HashMap<>();
        attachParams.put("customer", customerId);
        com.stripe.model.PaymentMethod pm = com.stripe.model.PaymentMethod.retrieve(stripePaymentMethodId);
        pm = pm.attach(attachParams);

        // Optionally set as default on the customer
        Map<String, Object> invoiceSettings = Map.of("default_payment_method", stripePaymentMethodId);
        com.stripe.model.Customer updated = com.stripe.model.Customer.retrieve(customerId)
                .update(Map.of("invoice_settings", invoiceSettings));

        // Extract safe card details for your DB
        com.stripe.model.PaymentMethod.Card card = pm.getCard();

        PaymentMethod entity = PaymentMethod.builder()
                .user(user)
                .provider(PaymentProvider.STRIPE)
                .type(PaymentMethodType.CARD)
                .providerPaymentMethodId(pm.getId())
                .cardHolderName(cardholderName)
                .brand(mapBrand(card.getBrand()))
                .last4(card.getLast4())
                .expMonth(Math.toIntExact(card.getExpMonth()))
                .expYear(Math.toIntExact(card.getExpYear()))
                .billingAddress(billingAddress)
                .defaultMethod(true)
                .active(true)
                .build();

        // If setting default, unset previous default
        paymentMethodRepo.findByUserIdAndDefaultMethodTrue(userId)
                .ifPresent(old -> { old.setDefaultMethod(false); paymentMethodRepo.save(old); });

        return paymentMethodRepo.save(entity);
    }

    private PaymentBrand mapBrand(String stripeBrand) {
        if (stripeBrand == null) return PaymentBrand.OTHER;
        return switch (stripeBrand.toLowerCase()) {
            case "visa" -> PaymentBrand.VISA;
            case "mastercard" -> PaymentBrand.MASTERCARD;
            case "amex" -> PaymentBrand.AMEX;
            case "discover" -> PaymentBrand.DISCOVER;
            default -> PaymentBrand.OTHER;
        };
    }

    /**
     * Create a Stripe Checkout Session for subscription
     * Returns a URL that frontend should redirect user to
     */
    @Transactional
    public String createCheckoutSession(Long userId, PlanType planType, String successUrl, String cancelUrl) 
            throws Exception {
        
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        SubscriptionPlan plan = subscriptionPlanRepo.findByPlanType(planType)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found"));

        if (plan.getStripePriceId() == null) {
            throw new RuntimeException("Stripe price ID not configured for plan: " + planType);
        }

        // Ensure customer exists in Stripe
        String customerId = ensureStripeCustomer(user);

        // Cancel any existing active subscription for this user
        userSubscriptionRepo.findActiveSubscriptionByUserId(userId)
                .ifPresent(existing -> {
                    try {
                        cancelSubscriptionInStripe(existing.getStripeSubscriptionId());
                        existing.setStatus(SubscriptionStatus.CANCELLED);
                        userSubscriptionRepo.save(existing);
                    } catch (StripeException e) {
                        throw new RuntimeException("Failed to cancel existing subscription", e);
                    }
                });

        // Create Checkout Session
        Map<String, Object> params = new HashMap<>();
        params.put("customer", customerId);
        params.put("mode", "subscription");
        params.put("line_items", new Object[]{
            Map.of(
                "price", plan.getStripePriceId(),
                "quantity", 1
            )
        });
        params.put("success_url", successUrl);
        params.put("cancel_url", cancelUrl);
        
        // Store user ID in metadata to identify on webhook
        params.put("metadata", Map.of("userId", userId.toString()));
        
        com.stripe.model.checkout.Session session = 
                com.stripe.model.checkout.Session.create(params);

        return session.getUrl();
    }

    /**
     * Create a Stripe subscription for a user (Direct API method)
     * Use createCheckoutSession for hosted checkout page instead
     */
    @Transactional
    public UserSubscription createSubscription(Long userId, PlanType planType, String paymentMethodId) 
            throws Exception {
        
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        SubscriptionPlan plan = subscriptionPlanRepo.findByPlanType(planType)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found"));

        if (plan.getStripePriceId() == null) {
            throw new RuntimeException("Stripe price ID not configured for plan: " + planType);
        }

        // Ensure customer exists in Stripe
        String customerId = ensureStripeCustomer(user);

        // Attach payment method if provided
        if (paymentMethodId != null) {
            Map<String, Object> attachParams = new HashMap<>();
            attachParams.put("customer", customerId);
            com.stripe.model.PaymentMethod pm = com.stripe.model.PaymentMethod.retrieve(paymentMethodId);
            pm.attach(attachParams);

            // Set as default payment method
            Map<String, Object> customerParams = new HashMap<>();
            Map<String, Object> invoiceSettings = new HashMap<>();
            invoiceSettings.put("default_payment_method", paymentMethodId);
            customerParams.put("invoice_settings", invoiceSettings);
            com.stripe.model.Customer.retrieve(customerId).update(customerParams);
        }

        // Cancel any existing active subscription for this user
        userSubscriptionRepo.findActiveSubscriptionByUserId(userId)
                .ifPresent(existing -> {
                    try {
                        cancelSubscriptionInStripe(existing.getStripeSubscriptionId());
                        existing.setStatus(SubscriptionStatus.CANCELLED);
                        userSubscriptionRepo.save(existing);
                    } catch (StripeException e) {
                        throw new RuntimeException("Failed to cancel existing subscription", e);
                    }
                });

        // Create subscription in Stripe
        Map<String, Object> subscriptionParams = new HashMap<>();
        subscriptionParams.put("customer", customerId);
        subscriptionParams.put("items", new Object[]{
                Map.of("price", plan.getStripePriceId())
        });
        subscriptionParams.put("payment_behavior", "default_incomplete");
        subscriptionParams.put("expand", new String[]{"latest_invoice.payment_intent"});

        com.stripe.model.Subscription stripeSubscription = 
                com.stripe.model.Subscription.create(subscriptionParams);

        // Save subscription in database
        UserSubscription userSubscription = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .stripeSubscriptionId(stripeSubscription.getId())
                .status(mapStripeStatus(stripeSubscription.getStatus()))
                .currentPeriodStart(Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodStart()))
                .currentPeriodEnd(Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodEnd()))
                .cancelAtPeriodEnd(stripeSubscription.getCancelAtPeriodEnd())
                .build();

        return userSubscriptionRepo.save(userSubscription);
    }

    /**
     * Cancel a subscription at period end
     */
    @Transactional
    public UserSubscription cancelSubscription(Long userId) throws StripeException {
        UserSubscription subscription = userSubscriptionRepo.findActiveSubscriptionByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No active subscription found"));

        // Cancel in Stripe at period end
        com.stripe.model.Subscription stripeSubscription = 
                com.stripe.model.Subscription.retrieve(subscription.getStripeSubscriptionId());
        
        Map<String, Object> params = new HashMap<>();
        params.put("cancel_at_period_end", true);
        stripeSubscription.update(params);

        subscription.setCancelAtPeriodEnd(true);
        return userSubscriptionRepo.save(subscription);
    }

    /**
     * Immediately cancel a subscription in Stripe
     */
    private void cancelSubscriptionInStripe(String stripeSubscriptionId) throws StripeException {
        com.stripe.model.Subscription stripeSubscription = 
                com.stripe.model.Subscription.retrieve(stripeSubscriptionId);
        stripeSubscription.cancel();
    }

    /**
     * Handle Stripe webhook events for subscriptions
     */
    @Transactional
    public void handleSubscriptionWebhook(com.stripe.model.Subscription stripeSubscription) {
        userSubscriptionRepo.findByStripeSubscriptionId(stripeSubscription.getId())
                .ifPresent(subscription -> {
                    subscription.setStatus(mapStripeStatus(stripeSubscription.getStatus()));
                    subscription.setCurrentPeriodStart(
                            Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodStart()));
                    subscription.setCurrentPeriodEnd(
                            Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodEnd()));
                    subscription.setCancelAtPeriodEnd(stripeSubscription.getCancelAtPeriodEnd());
                    userSubscriptionRepo.save(subscription);
                });
    }

    /**
     * Map Stripe subscription status to our enum
     */
    private SubscriptionStatus mapStripeStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "active" -> SubscriptionStatus.ACTIVE;
            case "canceled" -> SubscriptionStatus.CANCELLED;
            case "past_due" -> SubscriptionStatus.PAST_DUE;
            case "incomplete" -> SubscriptionStatus.INCOMPLETE;
            case "trialing" -> SubscriptionStatus.TRIALING;
            case "unpaid" -> SubscriptionStatus.UNPAID;
            default -> SubscriptionStatus.CANCELLED;
        };
    }

    /**
     * Process a one-time payment for a pay-per-trip charge
     */
    @Transactional
    public void chargeForTrip(Long userId, double amount, String description) throws Exception {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String customerId = ensureStripeCustomer(user);

        // Create a payment intent for the trip charge
        Map<String, Object> params = new HashMap<>();
        params.put("amount", (long)(amount * 100)); // Convert to cents
        params.put("currency", "cad");
        params.put("customer", customerId);
        params.put("description", description);
        params.put("automatic_payment_methods", Map.of("enabled", true, "allow_redirects", "never"));

        com.stripe.model.PaymentIntent paymentIntent = 
                com.stripe.model.PaymentIntent.create(params);
        
        // Note: In production, you'd confirm this payment intent
        // For now, we just create it and let the frontend handle confirmation
    }
}
