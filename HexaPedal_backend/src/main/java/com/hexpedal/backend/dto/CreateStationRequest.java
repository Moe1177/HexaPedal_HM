package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.PositionStates;

public record CreateStationRequest(
    String name,
    String address,
    int bikeCapacity,
    PositionStates position 
) {}