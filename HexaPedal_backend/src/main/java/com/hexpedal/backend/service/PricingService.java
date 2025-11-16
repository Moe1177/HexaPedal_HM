package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CostEstimateDto;
import com.hexpedal.backend.model.BikePricingPlan;
import com.hexpedal.backend.model.LoyaltyTier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class PricingService {

    public CostEstimateDto estimateTripCost(String bikeType, double durationMinutes) {
        return estimateTripCostWithTier(bikeType, durationMinutes, LoyaltyTier.NONE);
    }

    public CostEstimateDto estimateTripCostWithTier(String bikeType, double durationMinutes, LoyaltyTier tier) {
        BikePricingPlan plan = BikePricingPlan.fromBikeType(bikeType);

        BigDecimal baseCost = plan.calculateCost(durationMinutes)
                .setScale(2, RoundingMode.HALF_UP);

        double discount = tier.getDiscountPercentage();
        BigDecimal discountAmount = baseCost.multiply(BigDecimal.valueOf(discount))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalCost = baseCost.subtract(discountAmount);

        StringBuilder breakdown = new StringBuilder();
        breakdown.append(String.format("Bike Type: %s\n", plan.getBikeType()));
        breakdown.append(String.format("Base Fee: $%.2f CAD\n", plan.getBaseFee()));
        breakdown.append(String.format("Duration: %.1f minutes × $%.2f/minute = $%.2f CAD\n",
                durationMinutes, plan.getRatePerMinute(),
                plan.getRatePerMinute().multiply(BigDecimal.valueOf(durationMinutes))));
        breakdown.append(String.format("Subtotal: $%.2f CAD\n", baseCost));

        if (discount > 0) {
            breakdown.append(String.format("%s tier discount (%.0f%%): -$%.2f CAD\n",
                    tier.name(), discount * 100, discountAmount));
        }

        breakdown.append(String.format("Final cost: $%.2f CAD", finalCost));

        return new CostEstimateDto(durationMinutes, finalCost, breakdown.toString());
    }

    public record PricingPlanInfo(
            String bikeType,
            BigDecimal baseFee,
            BigDecimal ratePerMinute,
            String description
    ) {}

    public java.util.List<PricingPlanInfo> getAllPricingPlans() {
        return java.util.List.of(
                new PricingPlanInfo(
                        "Standard",
                        new BigDecimal("1.00"),
                        new BigDecimal("0.02"),
                        "Standard bike: $1.00 base fee + $0.02/minute"
                ),
                new PricingPlanInfo(
                        "Electric",
                        new BigDecimal("3.00"),
                        new BigDecimal("0.05"),
                        "Electric bike: $3.00 base fee + $0.05/minute"
                )
        );
    }

    public record LoyaltyTierInfo(
            String tierName,
            double discountPercentage,
            int reservationHoldMinutes,
            String description
    ) {}

    public java.util.List<LoyaltyTierInfo> getAllTiers() {
        return java.util.List.of(
                new LoyaltyTierInfo(
                        "BRONZE",
                        0.05,
                        10,
                        "5% discount on all trips, 10-minute reservation hold"
                ),
                new LoyaltyTierInfo(
                        "SILVER",
                        0.10,
                        12,
                        "10% discount on all trips, 12-minute reservation hold"
                ),
                new LoyaltyTierInfo(
                        "GOLD",
                        0.15,
                        15,
                        "15% discount on all trips, 15-minute reservation hold"
                )
        );
    }
}