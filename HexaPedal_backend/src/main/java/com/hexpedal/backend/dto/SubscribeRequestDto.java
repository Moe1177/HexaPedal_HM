package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.PlanType;

public record SubscribeRequestDto(
        PlanType planType,
        String paymentMethodId
) {
}

