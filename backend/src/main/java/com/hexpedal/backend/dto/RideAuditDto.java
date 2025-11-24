package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.User;

import java.time.Instant;

public record RideAuditDto(
        Integer rideId,
        Long userId,
        String userEmail,
        String userName,
        String userRole,
        Instant startDateTime,
        Instant endDateTime,
        Integer bikeId,
        String bikeType,
        String originStation,
        String arrivalStation,
        double distance,
        double duration,
        double cost
) {
    public static RideAuditDto from(Rides ride) {
        User user = ride.getUser();
        String userRole = user instanceof com.hexpedal.backend.model.Operator ? "OPERATOR" : "RIDER";
        String userName = user.getFullName() != null ? user.getFullName() : user.getEmail();
        
        return new RideAuditDto(
                ride.getRide_id(),
                user.getId(),
                user.getEmail(),
                userName,
                userRole,
                ride.getStartTimestamp(),
                ride.getEndTimestamp(),
                ride.getBike() != null ? ride.getBike().getId() : null,
                ride.getBike() != null ? ride.getBike().getType() : null,
                ride.getStartLocation(),
                ride.getEndLocation(),
                ride.getDistance(),
                ride.getDuration(),
                ride.getCost()
        );
    }
}

