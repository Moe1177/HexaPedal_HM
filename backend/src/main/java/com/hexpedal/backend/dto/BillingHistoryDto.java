package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.Rides;

import java.time.Instant;

public record BillingHistoryDto(
        Integer rideId,
        Instant startDateTime,
        Integer bikeId,
        String originStation,
        String arrivalStation,
        double distance,
        double duration,
        double cost,
        Integer flexDollarsUsed
) {
    public static BillingHistoryDto from(Rides ride) {
        // The cost field already contains the final cost (after flex dollars) since ReservationService
        // saves finalCostToCharge. We return it as-is for display purposes.
        // flexDollarsUsed is included for transparency to show how much was deducted.
        return new BillingHistoryDto(
                ride.getRide_id(),
                ride.getStartTimestamp(),
                ride.getBike() != null ? ride.getBike().getId() : null,
                ride.getStartLocation(),
                ride.getEndLocation(),
                ride.getDistance(),
                ride.getDuration(),
                ride.getCost(), // This is already the final cost after flex dollars
                ride.getFlexDollarsUsed() != null ? ride.getFlexDollarsUsed() : 0
        );
    }
}