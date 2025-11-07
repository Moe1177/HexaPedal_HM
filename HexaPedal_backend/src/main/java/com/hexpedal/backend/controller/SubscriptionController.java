package com.hexpedal.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hexpedal.backend.dto.CheckoutSessionRequestDTO;
import com.hexpedal.backend.dto.CheckoutSessionResponseDTO;
import com.hexpedal.backend.dto.PricingOptionDTO;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.service.StripePlanService;
import com.hexpedal.backend.service.StripeSubscriptionService;
import com.stripe.exception.StripeException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final StripeSubscriptionService subscriptionService;
    private final StripePlanService stripePlanService;

   
    @GetMapping("/pricing")
    public ResponseEntity<List<PricingOptionDTO>> getPricingOptions() throws StripeException {
        List<PricingOptionDTO> pricingOptions = stripePlanService.getActivePlans().stream()
                .map(plan -> new PricingOptionDTO(
                        plan.getPriceId(),
                        plan.getDisplayName(),
                        plan.getPriceId(),
                        plan.getAmount(),
                        plan.getCurrency(),
                        plan.getInterval()
                ))
                .toList();
        return ResponseEntity.ok(pricingOptions);
    }

    @PostMapping("/checkout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CheckoutSessionResponseDTO> createCheckoutSession(
            @AuthenticationPrincipal User user,
            @RequestBody CheckoutSessionRequestDTO request) throws StripeException {

        // request.planType() is Stripe Price ID
        String priceId = request.planType();
        if (priceId == null || priceId.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        com.stripe.model.checkout.Session session = subscriptionService.createCheckoutSession(
                user.getId(),
                priceId,
                request.successUrl(),
                request.cancelUrl()
        );

        return ResponseEntity.ok(new CheckoutSessionResponseDTO(
                session.getId(),
                session.getUrl()
        ));
    }

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getActiveSubscription(@AuthenticationPrincipal User user) {
        return subscriptionService.getActiveSubscription(user.getId())
                .map(subscription -> ResponseEntity.ok(subscription))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create Stripe Billing Portal session for subscription management
     */
    @PostMapping("/billing-portal")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> createBillingPortalSession(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) throws StripeException {
        
        String returnUrl = request.getOrDefault("returnUrl", "http://localhost:3000/account");
        com.stripe.model.billingportal.Session session = 
                subscriptionService.createBillingPortalSession(user.getId(), returnUrl);
        
        return ResponseEntity.ok(Map.of("url", session.getUrl()));
    }
}

