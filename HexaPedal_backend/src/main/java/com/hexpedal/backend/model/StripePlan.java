package com.hexpedal.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a subscription plan fetched from Stripe.
 * Pricing rules are stored in Stripe Price metadata.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StripePlan {
    private String priceId;
    private String productId;
    private String displayName;
    private String interval; // month, year
    private Long amount; // in cents
    private String currency;
}

