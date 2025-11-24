package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.PlanType;
import com.hexpedal.backend.model.SubscriptionPlan;

import java.math.BigDecimal;

public record PricingPlanDto(
        Long id,
        PlanType planType,
        String name,
        BigDecimal price,
        String description,
        BigDecimal ratePerMinute
) {
    public static PricingPlanDto from(SubscriptionPlan plan) {
        return new PricingPlanDto(
                plan.getId(),
                plan.getPlanType(),
                plan.getName(),
                plan.getPrice(),
                plan.getDescription(),
                plan.getRatePerMinute()
        );
    }
}

