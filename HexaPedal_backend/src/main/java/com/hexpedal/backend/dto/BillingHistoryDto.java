package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.Rides;

import java.time.Instant;

public record BillingHistoryDto(
        Integer rideId,
        Instant startDateTime,
        Long bikeId,
        String originStation,
        String arrivalStation,
        double distance,
        double duration,
        double cost
) {
    public static BillingHistoryDto from(Rides ride) {
        return new BillingHistoryDto(
                ride.getRide_id(),
                ride.getStartTimestamp(),
                ride.getBike() != null ? ride.getBike().getId() : null,
                ride.getStartLocation(),
                ride.getEndLocation(),
                ride.getDistance(),
                ride.getDuration(),
                ride.getCost()
        );
    }
}

