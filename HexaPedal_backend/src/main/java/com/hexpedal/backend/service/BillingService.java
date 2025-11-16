package com.hexpedal.backend.service;

import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.repository.RidesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final RidesRepository ridesRepository;
    private final LoyaltyService loyaltyService;

    // Base rate: $0.01 CAD per minute (R-PRC-02)
    private static final BigDecimal BASE_RATE_PER_MINUTE = new BigDecimal("0.01");

    @Transactional
    public double calculateTripCost(Long userId, double durationMinutes) {
        // Calculate base cost
        BigDecimal duration = BigDecimal.valueOf(durationMinutes);
        BigDecimal baseCost = BASE_RATE_PER_MINUTE.multiply(duration)
                .setScale(2, RoundingMode.HALF_UP);

        // Apply loyalty discount
        double finalCost = loyaltyService.applyDiscount(userId, baseCost.doubleValue());

        return finalCost;
    }

    public String generateCostBreakdown(Long userId, double durationMinutes, double cost, int flexDollarsUsed) {
        BigDecimal duration = BigDecimal.valueOf(durationMinutes);
        BigDecimal baseCost = BASE_RATE_PER_MINUTE.multiply(duration)
                .setScale(2, RoundingMode.HALF_UP);

        double discountPercentage = loyaltyService.getOrCreateLoyalty(
                createRiderProxy(userId)
        ).getDiscountPercentage();

        double flexDollarsInDollars = flexDollarsUsed / 100.0;
        double finalCost = cost - flexDollarsInDollars;

        StringBuilder breakdown = new StringBuilder();
        breakdown.append(String.format("Base: %.1f minutes × $0.01/minute = $%.2f CAD\n",
                durationMinutes, baseCost.doubleValue()));

        if (discountPercentage > 0) {
            breakdown.append(String.format("Loyalty discount (%.0f%%): -$%.2f CAD\n",
                    discountPercentage * 100,
                    baseCost.doubleValue() - cost));
        }

        if (flexDollarsUsed > 0) {
            breakdown.append(String.format("Flex dollars applied: -%d flex dollars ($%.2f CAD)\n",
                    flexDollarsUsed, flexDollarsInDollars));
        }

        breakdown.append(String.format("Final cost: $%.2f CAD", Math.max(0, finalCost)));

        return breakdown.toString();
    }

    // Maintain backward compatibility for existing calls
    public String generateCostBreakdown(Long userId, double durationMinutes, double cost) {
        return generateCostBreakdown(userId, durationMinutes, cost, 0);
    }

    @Transactional
    public void updateRideCost(Integer rideId, double cost) {
        Rides ride = ridesRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        ride.setCost(cost);
        ridesRepository.save(ride);
    }

    private com.hexpedal.backend.model.Rider createRiderProxy(Long userId) {
        com.hexpedal.backend.model.Rider rider = new com.hexpedal.backend.model.Rider();
        rider.setId(userId);
        return rider;
    }
}