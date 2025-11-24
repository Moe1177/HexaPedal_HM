package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.PlanType;

public record CheckoutSessionRequestDto(
        PlanType planType,
        String successUrl,
        String cancelUrl
) {
}

