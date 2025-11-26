package com.hexpedal.backend.dto;

import java.time.LocalDateTime;

public record UserReservationStatusDTO(
        boolean hasReservation,
        Integer bikeId,
        String bikeType,
        String stationName,
        LocalDateTime expiresAt
) {}