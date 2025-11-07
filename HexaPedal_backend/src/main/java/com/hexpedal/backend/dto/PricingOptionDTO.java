package com.hexpedal.backend.dto;

public record PricingOptionDTO(
    String planType,
    String displayName,
    String stripePriceId,
    Long amount,
    String currency,
    String interval
) {}

