package com.hexpedal.backend.dto;

public record GuestConversionRequest(
        String fullName,
        String email,
        String username,
        String password
) {}

