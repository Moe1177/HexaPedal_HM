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
    String chargeStatus,
    String stripeChargeId,
    Instant createdAt
) {}

