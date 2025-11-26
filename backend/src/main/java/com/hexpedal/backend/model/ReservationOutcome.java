package com.hexpedal.backend.model;

public enum ReservationOutcome {
    PENDING,    // Reservation created but not yet claimed or expired
    CLAIMED,    // Reservation successfully claimed and trip started
    EXPIRED,    // Reservation timed out without being claimed
    CANCELLED   // Reservation manually cancelled by user
}

