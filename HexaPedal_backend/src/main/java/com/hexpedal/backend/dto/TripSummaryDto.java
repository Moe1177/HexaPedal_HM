package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.Rides;

import java.time.Instant;

public record TripSummaryDto(
        Integer rideId,
        Integer bikeId,
        String startLocation,
        String endLocation,
        Instant startTimestamp,
        Instant endTimestamp,
        double duration,
        double distance,
        double cost,
        String costBreakdown
) {
    public static TripSummaryDto from(Rides ride, String costBreakdown) {
        return new TripSummaryDto(
                ride.getRide_id(),
                ride.getBike() != null ? ride.getBike().getId() : null,
                ride.getStartLocation(),
                ride.getEndLocation(),
                ride.getStartTimestamp(),
                ride.getEndTimestamp(),
                ride.getDuration(),
                ride.getDistance(),
                ride.getCost(),
                costBreakdown
        );
    }
}

