package com.hexpedal.backend.dto;

import java.time.Instant;

public record BillingHistoryDTO(
    Long chargeId,
    Integer rideId,
    Integer bikeId,
    String planType,
    Instant startTimestamp,
    Instant endTimestamp,
    String startLocation,
    String endLocation,
    Double durationMinutes,
    Double distanceKm,
    CostSummary costSummary,
    String chargeStatus,
    String stripeChargeId,
    Instant createdAt
) {
    public record CostSummary(
        Double baseFee,
        Double timeCharge,
        Double unlockFee,
        Double totalCost
    ) {}
}

