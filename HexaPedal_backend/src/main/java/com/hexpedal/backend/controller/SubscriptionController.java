package com.hexpedal.backend.controller;

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
import com.hexpedal.backend.model.SubscriptionPlan;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.service.StripeSubscriptionService;
import com.stripe.exception.StripeException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final StripeSubscriptionService subscriptionService;

    @PostMapping("/checkout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CheckoutSessionResponseDTO> createCheckoutSession(
            @AuthenticationPrincipal User user,
            @RequestBody CheckoutSessionRequestDTO request) throws StripeException {

        SubscriptionPlan plan;
        try {
            plan = SubscriptionPlan.valueOf(request.planType().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        com.stripe.model.checkout.Session session = subscriptionService.createCheckoutSession(
                user.getId(),
                plan,
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
}

