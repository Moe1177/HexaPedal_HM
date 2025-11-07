package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CostEstimateDto;
import com.hexpedal.backend.dto.PricingPlanDto;
import com.hexpedal.backend.model.PlanType;
import com.hexpedal.backend.model.SubscriptionPlan;
import com.hexpedal.backend.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PricingService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;

    /**
     * Get all active pricing plans for public display (R-PRC-01)
     */
    public List<PricingPlanDto> getAllActivePricingPlans() {
        return subscriptionPlanRepository.findByActiveTrue()
                .stream()
                .map(PricingPlanDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Estimate trip cost based on duration for pay-per-trip users
     */
    public CostEstimateDto estimateTripCost(double durationMinutes) {
        SubscriptionPlan payPerTripPlan = subscriptionPlanRepository.findByPlanType(PlanType.PAY_PER_TRIP)
                .orElseThrow(() -> new RuntimeException("Pay-per-trip plan not configured"));

        BigDecimal ratePerMinute = payPerTripPlan.getRatePerMinute();
        BigDecimal duration = BigDecimal.valueOf(durationMinutes);
        BigDecimal estimatedCost = ratePerMinute.multiply(duration).setScale(2, RoundingMode.HALF_UP);

        String breakdown = String.format("Duration: %.1f minutes × Rate: $%.2f/minute = $%.2f CAD",
                durationMinutes, ratePerMinute, estimatedCost);

        return new CostEstimateDto(durationMinutes, estimatedCost, breakdown);
    }
}

