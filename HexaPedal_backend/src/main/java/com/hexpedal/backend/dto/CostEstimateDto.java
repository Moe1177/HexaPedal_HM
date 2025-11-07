package com.hexpedal.backend.dto;

import java.math.BigDecimal;

public record CostEstimateDto(
        double distanceKm,
        BigDecimal estimatedCost,
        String breakdown
) {
}

