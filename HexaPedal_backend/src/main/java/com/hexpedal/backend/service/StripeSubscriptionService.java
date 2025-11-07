package com.hexpedal.backend.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.hexpedal.backend.model.User;
import com.hexpedal.backend.model.UserSubscription;
import com.hexpedal.backend.repository.UserRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripeSubscriptionService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final StripePlanService stripePlanService;

    @Value("${stripe.success-url:http://localhost:3000/success}")
    private String defaultSuccessUrl;

    @Value("${stripe.cancel-url:http://localhost:3000/cancel}")
    private String defaultCancelUrl;

    private String ensureStripeCustomer(User user) throws StripeException {
        if (user.getStripeCustomerId() != null) {
            return user.getStripeCustomerId();
        }

        Map<String, Object> params = new HashMap<>();
        params.put("email", user.getEmail());
        params.put("name", user.getFullName());
        Customer customer = Customer.create(params);
        user.setStripeCustomerId(customer.getId());
        userRepository.save(user);
        return customer.getId();
    }

    public com.stripe.model.checkout.Session createCheckoutSession(Long userId, String priceId, 
                                         String successUrl, String cancelUrl) throws StripeException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        String customerId = ensureStripeCustomer(user);

        if (priceId == null || priceId.isEmpty()) {
            throw new IllegalArgumentException("Stripe Price ID is required");
        }

        com.stripe.param.checkout.SessionCreateParams params = 
                com.stripe.param.checkout.SessionCreateParams.builder()
                .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomer(customerId)
                .setSuccessUrl(successUrl != null ? successUrl : defaultSuccessUrl)
                .setCancelUrl(cancelUrl != null ? cancelUrl : defaultCancelUrl)
                .addLineItem(
                        com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
                                .setPrice(priceId)
                                .setQuantity(1L)
                                .build()
                )
                .putMetadata("user_id", userId.toString())
                .putMetadata("price_id", priceId)
                .build();

        return com.stripe.model.checkout.Session.create(params);
    }

    /**
     * Create a Stripe Billing Portal session for subscription management
     */
    public com.stripe.model.billingportal.Session createBillingPortalSession(Long userId, String returnUrl) throws StripeException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getStripeCustomerId() == null) {
            throw new IllegalStateException("User does not have a Stripe customer ID");
        }

        com.stripe.param.billingportal.SessionCreateParams params = 
                com.stripe.param.billingportal.SessionCreateParams.builder()
                .setCustomer(user.getStripeCustomerId())
                .setReturnUrl(returnUrl)
                .build();

        return com.stripe.model.billingportal.Session.create(params);
    }

    public void handleSubscriptionCreatedOrUpdated(String stripeSubscriptionId) throws StripeException {
        com.stripe.model.Subscription stripeSubscription = 
                com.stripe.model.Subscription.retrieve(stripeSubscriptionId);

        String customerId = stripeSubscription.getCustomer();
        User user = userRepository.findByStripeCustomerId(customerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found for customer: " + customerId));

        String priceId = stripeSubscription.getItems().getData().get(0).getPrice().getId();
        com.hexpedal.backend.model.StripePlan stripePlan = stripePlanService.getPlanByPriceId(priceId);

        Optional<UserSubscription> existing = subscriptionRepository
                .findByStripeSubscriptionId(stripeSubscriptionId);

        UserSubscription subscription;
        if (existing.isPresent()) {
            subscription = existing.get();
        } else {
            subscription = UserSubscription.builder()
                    .user(user)
                    .planName(stripePlan.getDisplayName())
                    .stripeSubscriptionId(stripeSubscriptionId)
                    .stripePriceId(priceId)
                    .build();
        }

        subscription.setStatus(stripeSubscription.getStatus());
        subscription.setStripePriceId(priceId);
        subscription.setPlanName(stripePlan.getDisplayName());
        subscription.setCurrentPeriodStart(
                java.time.Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodStart())
        );
        subscription.setCurrentPeriodEnd(
                java.time.Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodEnd())
        );
        subscription.setCancelAtPeriodEnd(stripeSubscription.getCancelAtPeriodEnd());

        subscriptionRepository.save(subscription);
    }


    public Optional<UserSubscription> getActiveSubscription(Long userId) {
        return subscriptionRepository.findByUserIdAndStatusIn(
                userId, 
                java.util.List.of("active", "trialing")
        );
    }
}

