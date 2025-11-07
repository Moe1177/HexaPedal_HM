package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.SubscribeRequestDto;
import com.hexpedal.backend.dto.SubscriptionDto;
import com.hexpedal.backend.model.Rider;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.model.UserSubscription;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import com.hexpedal.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final PaymentService paymentService;
    private final UserSubscriptionRepository userSubscriptionRepository;


    @PostMapping("/create-checkout-session")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> createCheckoutSession(
            @AuthenticationPrincipal User user,
            @RequestBody com.hexpedal.backend.dto.CheckoutSessionRequestDto request) {
        
        // Verify user is a Rider
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can subscribe to plans");
        }

        try {
            String checkoutUrl = paymentService.createCheckoutSession(
                    user.getId(),
                    request.planType(),
                    request.successUrl(),
                    request.cancelUrl()
            );
            
            return ResponseEntity.ok(new CheckoutSessionResponse(
                    checkoutUrl,
                    "Redirect user to this URL to complete subscription"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    "Failed to create checkout session: " + e.getMessage()
            );
        }
    }

 
    @PostMapping("/subscribe")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> subscribe(
            @AuthenticationPrincipal User user,
            @RequestBody SubscribeRequestDto request) {
        
        // Verify user is a Rider
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can subscribe to plans");
        }

        try {
            UserSubscription subscription = paymentService.createSubscription(
                    user.getId(),
                    request.planType(),
                    request.paymentMethodId()
            );
            
            return ResponseEntity.ok(SubscriptionDto.from(subscription));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    "Failed to create subscription: " + e.getMessage()
            );
        }
    }

    /**
     * Cancel subscription at period end - Rider only
     */
    @PostMapping("/cancel")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> cancelSubscription(@AuthenticationPrincipal User user) {
        
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can cancel subscriptions");
        }

        try {
            UserSubscription subscription = paymentService.cancelSubscription(user.getId());
            return ResponseEntity.ok(SubscriptionDto.from(subscription));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    "Failed to cancel subscription: " + e.getMessage()
            );
        }
    }

    /**
     * Get current active subscription - Rider only
     */
    @GetMapping("/current")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> getCurrentSubscription(@AuthenticationPrincipal User user) {
        
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can view subscriptions");
        }

        Optional<UserSubscription> subscription = 
                userSubscriptionRepository.findActiveSubscriptionByUserId(user.getId());
        
        if (subscription.isEmpty()) {
            return ResponseEntity.ok().body("No active subscription");
        }

        return ResponseEntity.ok(SubscriptionDto.from(subscription.get()));
    }

    /**
     * Check if user has active subscription - Rider only
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> getSubscriptionStatus(@AuthenticationPrincipal User user) {
        
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can check subscription status");
        }

        boolean hasActive = userSubscriptionRepository.hasActiveSubscription(user.getId());
        return ResponseEntity.ok(new SubscriptionStatusResponse(hasActive));
    }

    // Response records
    private record SubscriptionStatusResponse(boolean hasActiveSubscription) {}
    private record CheckoutSessionResponse(String checkoutUrl, String message) {}
}

