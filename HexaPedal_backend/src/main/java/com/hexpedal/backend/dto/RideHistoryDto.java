package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.Rides;

import java.time.Instant;

public record RideHistoryDto(
        Integer ride_id,
        Integer bikeId,
        String startLocation,
        String endLocation,
        Instant startTimestamp,
        Instant endTimestamp,
        double duration,
        double distance,
        double cost,
        Integer flexDollarsUsed
) {
    public static RideHistoryDto from(Rides ride) {
        return new RideHistoryDto(
                ride.getRide_id(),
                ride.getBike() != null ? ride.getBike().getId() : null,
                ride.getStartLocation(),
                ride.getEndLocation(),
                ride.getStartTimestamp(),
                ride.getEndTimestamp(),
                ride.getDuration(),
                ride.getDistance(),
                ride.getCost(),
                ride.getFlexDollarsUsed() != null ? ride.getFlexDollarsUsed() : 0
        );
    }
}

