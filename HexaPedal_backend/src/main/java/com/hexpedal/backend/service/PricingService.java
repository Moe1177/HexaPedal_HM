package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CostEstimateDto;
import com.hexpedal.backend.model.LoyaltyTier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class PricingService {

    private static final BigDecimal BASE_RATE_PER_MINUTE = new BigDecimal("0.01");

    public CostEstimateDto estimateTripCost(double durationMinutes) {
        return estimateTripCostWithTier(durationMinutes, LoyaltyTier.NONE);
    }

    public CostEstimateDto estimateTripCostWithTier(double durationMinutes, LoyaltyTier tier) {
        BigDecimal duration = BigDecimal.valueOf(durationMinutes);
        BigDecimal baseCost = BASE_RATE_PER_MINUTE.multiply(duration)
                .setScale(2, RoundingMode.HALF_UP);

        double discount = tier.getDiscountPercentage();
        BigDecimal discountAmount = baseCost.multiply(BigDecimal.valueOf(discount))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalCost = baseCost.subtract(discountAmount);

        String breakdown;
        if (discount > 0) {
            breakdown = String.format(
                    "Duration: %.1f minutes × Rate: $%.2f/minute = $%.2f CAD\n" +
                            "%s tier discount (%.0f%%): -$%.2f CAD\n" +
                            "Final cost: $%.2f CAD",
                    durationMinutes,
                    BASE_RATE_PER_MINUTE,
                    baseCost,
                    tier.name(),
                    discount * 100,
                    discountAmount,
                    finalCost
            );
        } else {
            breakdown = String.format(
                    "Duration: %.1f minutes × Rate: $%.2f/minute = $%.2f CAD",
                    durationMinutes,
                    BASE_RATE_PER_MINUTE,
                    finalCost
            );
        }

        return new CostEstimateDto(durationMinutes, finalCost, breakdown);
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