package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.PlanType;
import com.hexpedal.backend.model.SubscriptionStatus;
import com.hexpedal.backend.model.UserSubscription;

import java.math.BigDecimal;
import java.time.Instant;

public record SubscriptionDto(
        Long id,
        PlanType planType,
        String planName,
        BigDecimal planPrice,
        SubscriptionStatus status,
        Instant currentPeriodStart,
        Instant currentPeriodEnd,
        boolean cancelAtPeriodEnd
) {
    public static SubscriptionDto from(UserSubscription subscription) {
        return new SubscriptionDto(
                subscription.getId(),
                subscription.getPlan().getPlanType(),
                subscription.getPlan().getName(),
                subscription.getPlan().getPrice(),
                subscription.getStatus(),
                subscription.getCurrentPeriodStart(),
                subscription.getCurrentPeriodEnd(),
                subscription.isCancelAtPeriodEnd()
        );
    }
}

