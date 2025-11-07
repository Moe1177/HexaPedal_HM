package com.hexpedal.backend.controller;

import com.hexpedal.backend.service.PaymentService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.Subscription;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final PaymentService paymentService;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    /**
     * Handle Stripe webhook events
     * Endpoint: POST /api/webhooks/stripe
     */
    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;

        try {
            // Verify webhook signature
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            // Invalid signature
            System.err.println("⚠️ Webhook signature verification failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        // Handle the event
        System.out.println("📨 Received Stripe webhook event: " + event.getType());

        try {
            switch (event.getType()) {
                case "customer.subscription.created":
                case "customer.subscription.updated":
                case "customer.subscription.deleted":
                    handleSubscriptionEvent(event);
                    break;

                case "invoice.paid":
                    handleInvoicePaid(event);
                    break;

                case "invoice.payment_failed":
                    handleInvoicePaymentFailed(event);
                    break;

                case "customer.subscription.trial_will_end":
                    handleTrialWillEnd(event);
                    break;

                default:
                    System.out.println("Unhandled event type: " + event.getType());
            }

            return ResponseEntity.ok("Webhook handled successfully");

        } catch (Exception e) {
            System.err.println("❌ Error processing webhook: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing webhook");
        }
    }

    /**
     * Handle subscription lifecycle events
     */
    private void handleSubscriptionEvent(Event event) {
        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        StripeObject stripeObject = null;

        if (dataObjectDeserializer.getObject().isPresent()) {
            stripeObject = dataObjectDeserializer.getObject().get();
        } else {
            System.err.println("Deserialization failed, probably due to API version mismatch");
            return;
        }

        if (stripeObject instanceof Subscription) {
            Subscription subscription = (Subscription) stripeObject;
            System.out.println("Processing subscription: " + subscription.getId() + " - Status: " + subscription.getStatus());
            
            // Update subscription in database
            paymentService.handleSubscriptionWebhook(subscription);
        }
    }

    /**
     * Handle successful invoice payment
     */
    private void handleInvoicePaid(Event event) {
        System.out.println("✅ Invoice paid successfully");
        // You can add additional logic here, such as:
        // - Sending confirmation emails
        // - Updating analytics
        // - Triggering notifications
    }

    /**
     * Handle failed invoice payment
     */
    private void handleInvoicePaymentFailed(Event event) {
        System.out.println("❌ Invoice payment failed");
        // You can add additional logic here, such as:
        // - Sending payment failure notifications to users
        // - Updating subscription status
        // - Retry logic
    }

    /**
     * Handle trial ending soon notification
     */
    private void handleTrialWillEnd(Event event) {
        System.out.println("⏰ Trial will end soon");
        // You can add additional logic here, such as:
        // - Sending reminder emails to users
        // - Prompting users to add payment method
    }
}

