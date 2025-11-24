package com.hexpedal.backend.model;

import java.math.BigDecimal;

public enum BikePricingPlan {
    STANDARD("Standard", new BigDecimal("1.00"), new BigDecimal("0.02")),
    ELECTRIC("electric", new BigDecimal("3.00"), new BigDecimal("0.05"));

    private final String bikeType;
    private final BigDecimal baseFee;
    private final BigDecimal ratePerMinute;

    BikePricingPlan(String bikeType, BigDecimal baseFee, BigDecimal ratePerMinute) {
        this.bikeType = bikeType;
        this.baseFee = baseFee;
        this.ratePerMinute = ratePerMinute;
    }

    public String getBikeType() {
        return bikeType;
    }

    public BigDecimal getBaseFee() {
        return baseFee;
    }

    public BigDecimal getRatePerMinute() {
        return ratePerMinute;
    }

    public static BikePricingPlan fromBikeType(String bikeType) {
        if (bikeType == null) {
            return STANDARD;
        }

        for (BikePricingPlan plan : values()) {
            if (plan.bikeType.equalsIgnoreCase(bikeType)) {
                return plan;
            }
        }

        return STANDARD;
    }

    public BigDecimal calculateCost(double durationMinutes) {
        BigDecimal duration = BigDecimal.valueOf(durationMinutes);
        BigDecimal timeCost = ratePerMinute.multiply(duration);
        return baseFee.add(timeCost);
    }
}
