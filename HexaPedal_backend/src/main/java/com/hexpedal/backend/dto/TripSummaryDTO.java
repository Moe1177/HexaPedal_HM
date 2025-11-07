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
    String planName,
    String chargeStatus,
    String stripeChargeId
) {}

