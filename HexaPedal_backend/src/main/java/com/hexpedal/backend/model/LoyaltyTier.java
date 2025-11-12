package com.hexpedal.backend.model;

import java.math.BigDecimal;

public enum LoyaltyTier {
    NONE(BigDecimal.ZERO, 0),
    BRONZE(new BigDecimal("0.05"), 0),
    SILVER(new BigDecimal("0.10"), 2),
    GOLD(new BigDecimal("0.15"), 5);

    private final BigDecimal discountRate;
    private final int extraReservationMinutes;

    LoyaltyTier(BigDecimal discountRate, int extraReservationMinutes) {
        this.discountRate = discountRate;
        this.extraReservationMinutes = extraReservationMinutes;
    }

    public BigDecimal getDiscountRate() {
        return discountRate;
    }

    public int getExtraReservationMinutes() {
        return extraReservationMinutes;
    }

    public boolean isHigherThan(LoyaltyTier other) {
        return this.ordinal() > other.ordinal();
    }
}
