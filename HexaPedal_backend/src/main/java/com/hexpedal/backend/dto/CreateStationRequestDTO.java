package com.hexpedal.backend.dto;

public record CreateStationRequestDTO(
    String name,
    String address,
    int bikeCapacity,
    double latitude,
    double longitude
) {}
