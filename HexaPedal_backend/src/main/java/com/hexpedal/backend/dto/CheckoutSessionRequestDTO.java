package com.hexpedal.backend.dto;

public record CheckoutSessionRequestDTO(
    String planType, 
    String successUrl,
    String cancelUrl
) {}

