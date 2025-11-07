package com.hexpedal.backend.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.hexpedal.backend.model.SubscriptionPlan;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.model.UserSubscription;
import com.hexpedal.backend.repository.UserRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripeSubscriptionService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;

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

    public Session createCheckoutSession(Long userId, SubscriptionPlan plan, 
                                         String successUrl, String cancelUrl) throws StripeException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        String customerId = ensureStripeCustomer(user);

        String priceId = getStripePriceIdForPlan(plan);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomer(customerId)
                .setSuccessUrl(successUrl != null ? successUrl : defaultSuccessUrl)
                .setCancelUrl(cancelUrl != null ? cancelUrl : defaultCancelUrl)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPrice(priceId)
                                .setQuantity(1L)
                                .build()
                )
                .putMetadata("user_id", userId.toString())
                .putMetadata("plan_type", plan.name())
                .build();

        return Session.create(params);
    }

   
    private String getStripePriceIdForPlan(SubscriptionPlan plan) throws StripeException {
        throw new IllegalStateException(
                "Stripe Price IDs must be configured. "
        );
    }

    public void handleSubscriptionCreatedOrUpdated(String stripeSubscriptionId) throws StripeException {
        com.stripe.model.Subscription stripeSubscription = 
                com.stripe.model.Subscription.retrieve(stripeSubscriptionId);

        String customerId = stripeSubscription.getCustomer();
        User user = userRepository.findByStripeCustomerId(customerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found for customer: " + customerId));

        SubscriptionPlan plan = determinePlanFromStripeSubscription(stripeSubscription);

        Optional<UserSubscription> existing = subscriptionRepository
                .findByStripeSubscriptionId(stripeSubscriptionId);

        UserSubscription subscription;
        if (existing.isPresent()) {
            subscription = existing.get();
        } else {
            subscription = UserSubscription.builder()
                    .user(user)
                    .plan(plan)
                    .stripeSubscriptionId(stripeSubscriptionId)
                    .build();
        }

        subscription.setStatus(stripeSubscription.getStatus());
        subscription.setStripePriceId(stripeSubscription.getItems().getData().get(0).getPrice().getId());
        subscription.setCurrentPeriodStart(
                java.time.Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodStart())
        );
        subscription.setCurrentPeriodEnd(
                java.time.Instant.ofEpochSecond(stripeSubscription.getCurrentPeriodEnd())
        );
        subscription.setCancelAtPeriodEnd(stripeSubscription.getCancelAtPeriodEnd());

        subscriptionRepository.save(subscription);
    }

 
    private SubscriptionPlan determinePlanFromStripeSubscription(
            com.stripe.model.Subscription stripeSubscription) {
        Map<String, String> metadata = stripeSubscription.getMetadata();
        if (metadata != null && metadata.containsKey("plan_type")) {
            try {
                return SubscriptionPlan.valueOf(metadata.get("plan_type"));
            } catch (IllegalArgumentException e) {
            }
        }
        
        return SubscriptionPlan.SINGLE_USE;
    }

    public Optional<UserSubscription> getActiveSubscription(Long userId) {
        return subscriptionRepository.findByUserIdAndStatusIn(
                userId, 
                java.util.List.of("active", "trialing")
        );
    }
}

