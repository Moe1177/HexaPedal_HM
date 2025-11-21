package com.hexpedal.backend.model;

import java.math.BigDecimal;

public enum LoyaltyTier {
    NONE(0, 0.0, 0),
    BRONZE(10, 0.05, 0),
    SILVER(15, 0.10, 2),
    GOLD(20, 0.15, 5);

    private final int minTripsRequired;
    private final double discountPercentage;
    private final int extraReservationMinutes;

    LoyaltyTier(int minTripsRequired, double discountPercentage, int extraReservationMinutes) {
        this.minTripsRequired = minTripsRequired;
        this.discountPercentage = discountPercentage;
        this.extraReservationMinutes = extraReservationMinutes;
    }

    public int getMinTripsRequired() {
        return minTripsRequired;
    }

    public double getDiscountPercentage() {
        return discountPercentage;
    }

    public int getExtraReservationMinutes() {
        return extraReservationMinutes;
    }

    public int getBaseReservationMinutes() {
        return 10;
    }

    public int getTotalReservationMinutes() {
        return getBaseReservationMinutes() + extraReservationMinutes;
    }
}