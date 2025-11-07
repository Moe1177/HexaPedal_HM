package com.hexpedal.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hexpedal.backend.service.StripeSubscriptionService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.net.Webhook;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/webhooks/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    private final StripeSubscriptionService subscriptionService;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        
        if (webhookSecret == null || webhookSecret.isEmpty()) {
            log.warn("Stripe webhook secret not configured. Skipping webhook verification.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Webhook secret not configured");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.error("Webhook signature verification failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid signature");
        } catch (Exception e) {
            log.error("Error parsing webhook event", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error parsing event");
        }

        switch (event.getType()) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
                handleSubscriptionEvent(event);
                break;
            case "customer.subscription.deleted":
                handleSubscriptionDeleted(event);
                break;
            default:
                log.debug("Unhandled event type: {}", event.getType());
        }

        return ResponseEntity.ok("Success");
    }

    private void handleSubscriptionEvent(Event event) {
        try {
            Subscription subscription = (Subscription) event.getDataObjectDeserializer()
                    .getObject().orElse(null);
            if (subscription != null) {
                subscriptionService.handleSubscriptionCreatedOrUpdated(subscription.getId());
                log.info("Processed subscription event: {}", subscription.getId());
            }
        } catch (Exception e) {
            log.error("Error handling subscription event", e);
        }
    }

    private void handleSubscriptionDeleted(Event event) {
        try {
            Subscription subscription = (Subscription) event.getDataObjectDeserializer()
                    .getObject().orElse(null);
            if (subscription != null) {
                log.info("Subscription deleted: {}", subscription.getId());
            }
        } catch (Exception e) {
            log.error("Error handling subscription deletion", e);
        }
    }
}

