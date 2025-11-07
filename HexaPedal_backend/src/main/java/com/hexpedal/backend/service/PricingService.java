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
     * Estimate trip cost based on distance for pay-per-trip users
     */
    public CostEstimateDto estimateTripCost(double distanceKm) {
        SubscriptionPlan payPerTripPlan = subscriptionPlanRepository.findByPlanType(PlanType.PAY_PER_TRIP)
                .orElseThrow(() -> new RuntimeException("Pay-per-trip plan not configured"));

        BigDecimal ratePerKm = payPerTripPlan.getRatePerKm();
        BigDecimal distance = BigDecimal.valueOf(distanceKm);
        BigDecimal estimatedCost = ratePerKm.multiply(distance).setScale(2, RoundingMode.HALF_UP);

        String breakdown = String.format("Distance: %.2f km × Rate: $%.2f/km = $%.2f CAD",
                distanceKm, ratePerKm, estimatedCost);

        return new CostEstimateDto(distanceKm, estimatedCost, breakdown);
    }
}

