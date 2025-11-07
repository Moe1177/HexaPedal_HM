package com.hexpedal.backend.dto;

import java.math.BigDecimal;

public record CostEstimateDto(
        double durationMinutes,
        BigDecimal estimatedCost,
        String breakdown
) {
}

