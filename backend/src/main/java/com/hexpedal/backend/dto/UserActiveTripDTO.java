package com.hexpedal.backend.dto;

import java.time.LocalDateTime;

public record UserActiveTripDTO(
        boolean hasActiveTrip,
        Integer bikeId,
        Long userId,
        String bikeType,
        LocalDateTime startedAt,
        String startStationName,
        String destinationStationName,
        Long destinationStationId,
        Double destinationLatitude,
        Double destinationLongitude
) {}

