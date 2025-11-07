package com.hexpedal.backend.dto;

import java.time.Instant;

public record TripSummaryDTO(
    Integer rideId,
    Integer bikeId,
    String startLocation,
    String endLocation,
    Instant startTimestamp,
    Instant endTimestamp,
    Double durationMinutes,
    Double distanceKm,
    String planType,
    CostBreakdown costBreakdown,
    String chargeStatus,
    String stripeChargeId
) {
    public record CostBreakdown(
        Double baseFee,
        Double timeCharge,
        Double unlockFee,
        Double totalCost
    ) {}
}

