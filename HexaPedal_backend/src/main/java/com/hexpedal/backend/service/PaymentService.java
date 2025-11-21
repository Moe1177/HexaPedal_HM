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
import java.util.Optional;

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

    public Optional<PaymentMethod> getDefaultPaymentMethod(Long userId) {
        return paymentMethodRepo.findByUserIdAndDefaultMethodTrue(userId);
    }

    public PaymentMethod saveStripePaymentMethod(Long userId, String stripePaymentMethodId,
                                                 BillingAddress billingAddress, String cardholderName)
            throws Exception {

        User user = userRepo.findById(userId).orElseThrow();
        String customerId = ensureStripeCustomer(user);


        Map<String, Object> attachParams = new HashMap<>();
        attachParams.put("customer", customerId);
        com.stripe.model.PaymentMethod pm = com.stripe.model.PaymentMethod.retrieve(stripePaymentMethodId);
        pm = pm.attach(attachParams);


        Map<String, Object> invoiceSettings = Map.of("default_payment_method", stripePaymentMethodId);
        com.stripe.model.Customer updated = com.stripe.model.Customer.retrieve(customerId)
                .update(Map.of("invoice_settings", invoiceSettings));


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


        paymentMethodRepo.findByUserIdAndDefaultMethodTrue(userId)
                .ifPresent(old -> {
                    old.setDefaultMethod(false);
                    paymentMethodRepo.save(old);
                });

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


        String customerId = ensureStripeCustomer(user);


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


        params.put("metadata", Map.of("userId", userId.toString()));

        com.stripe.model.checkout.Session session =
                com.stripe.model.checkout.Session.create(params);

        return session.getUrl();
    }


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

        Optional<UserSubscription> activeSubOpt = userSubscriptionRepo.findActiveSubscriptionByUserId(userId);
        if (activeSubOpt.isPresent() && activeSubOpt.get().getPlan().getPlanType() == planType) {

            return activeSubOpt.get();
        }



        String customerId = ensureStripeCustomer(user);


        if (paymentMethodId != null) {
            Map<String, Object> attachParams = new HashMap<>();
            attachParams.put("customer", customerId);
            com.stripe.model.PaymentMethod pm = com.stripe.model.PaymentMethod.retrieve(paymentMethodId);
            pm.attach(attachParams);

            Map<String, Object> customerParams = Map.of(
                    "invoice_settings", Map.of("default_payment_method", paymentMethodId)
            );
            com.stripe.model.Customer.retrieve(customerId).update(customerParams);
        }


        userSubscriptionRepo.findActiveSubscriptionByUserId(userId)
                .ifPresent(existing -> {
                    try {
                        cancelSubscriptionInStripe(existing.getStripeSubscriptionId());
                        existing.setStatus(SubscriptionStatus.CANCELLED);
                        userSubscriptionRepo.save(existing);
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                });


        Map<String, Object> subscriptionParams = new HashMap<>();
        subscriptionParams.put("customer", customerId);
        subscriptionParams.put("items", new Object[]{Map.of("price", plan.getStripePriceId())});
        subscriptionParams.put("payment_behavior", "allow_incomplete"); // temporarily allow incomplete
        subscriptionParams.put("expand", new String[]{"latest_invoice.payment_intent"});

        com.stripe.model.Subscription stripeSubscription =
                com.stripe.model.Subscription.create(subscriptionParams);




        com.stripe.model.Invoice invoice = stripeSubscription.getLatestInvoiceObject();
        com.stripe.model.PaymentIntent paymentIntent = invoice.getPaymentIntentObject();

        UserSubscription userSubscription = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .stripeSubscriptionId(stripeSubscription.getId())
                .status(mapStripeStatus(stripeSubscription.getStatus()))
                .currentPeriodStart(Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodStart()))
                .currentPeriodEnd(Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodEnd()))
                .cancelAtPeriodEnd(stripeSubscription.getCancelAtPeriodEnd())
                .build();

        userSubscription.setStatus(mapStripeStatus(stripeSubscription.getStatus()));

        return userSubscriptionRepo.save(userSubscription);
    }



    @Transactional
    public UserSubscription cancelSubscription(Long userId) throws StripeException {
        UserSubscription subscription = userSubscriptionRepo.findActiveSubscriptionByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No active subscription found"));


        com.stripe.model.Subscription stripeSubscription =
                com.stripe.model.Subscription.retrieve(subscription.getStripeSubscriptionId());

        stripeSubscription.cancel();
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelAtPeriodEnd(true);

        return userSubscriptionRepo.save(subscription);
    }


    private void cancelSubscriptionInStripe(String stripeSubscriptionId) throws StripeException {
        com.stripe.model.Subscription stripeSubscription =
                com.stripe.model.Subscription.retrieve(stripeSubscriptionId);
        stripeSubscription.cancel();
    }


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


    @Transactional
    public void chargeForTrip(Long userId, double amount, String description) throws Exception {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String customerId = ensureStripeCustomer(user);


        PaymentMethod defaultPm = paymentMethodRepo.findByUserIdAndDefaultMethodTrue(userId)
                .orElseThrow(() -> new RuntimeException("No default payment method found for user"));

        Map<String, Object> params = new HashMap<>();
        params.put("amount", (long)(amount * 100));
        params.put("currency", "cad");
        params.put("customer", customerId);
        params.put("payment_method", defaultPm.getProviderPaymentMethodId());
        params.put("off_session", true);
        params.put("confirm", true);
        params.put("description", description);

        com.stripe.model.PaymentIntent paymentIntent =
                com.stripe.model.PaymentIntent.create(params);

        if (!"succeeded".equals(paymentIntent.getStatus())) {
            throw new RuntimeException("Trip payment failed: " + paymentIntent.getStatus());
        }
    }
}
