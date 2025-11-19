package com.hexpedal.backend.service;

import com.hexpedal.backend.model.BikePricingPlan;
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

    private static final BigDecimal BASE_RATE_PER_MINUTE = new BigDecimal("0.01");

    @Transactional
    public double calculateTripCost(Long userId, String bikeType, double durationMinutes) {
        BikePricingPlan plan = BikePricingPlan.fromBikeType(bikeType);
        BigDecimal totalCost = plan.calculateCost(durationMinutes)
                .setScale(2, RoundingMode.HALF_UP);

        double finalCost = loyaltyService.applyDiscount(userId, totalCost.doubleValue());

        return finalCost;
    }

    public String generateCostBreakdown(Long userId, String bikeType, double durationMinutes, double cost, int flexDollarsUsed) {
        BikePricingPlan plan = BikePricingPlan.fromBikeType(bikeType);

        BigDecimal baseFee = plan.getBaseFee();
        BigDecimal ratePerMinute = plan.getRatePerMinute();
        BigDecimal duration = BigDecimal.valueOf(durationMinutes);
        BigDecimal timeCost = ratePerMinute.multiply(duration).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalBeforeDiscount = baseFee.add(timeCost);

        double discountPercentage = loyaltyService.getOrCreateLoyalty(
                createRiderProxy(userId)
        ).getDiscountPercentage();

        double flexDollarsInDollars = flexDollarsUsed / 100.0;
        double finalCost = cost - flexDollarsInDollars;

        StringBuilder breakdown = new StringBuilder();
        breakdown.append(String.format("Bike Type: %s\n", plan.getBikeType()));
        breakdown.append(String.format("Base Fee: $%.2f CAD\n", baseFee));
        breakdown.append(String.format("Time: %.1f minutes × $%.2f/minute = $%.2f CAD\n",
                durationMinutes, ratePerMinute, timeCost));
        breakdown.append(String.format("Subtotal: $%.2f CAD\n", totalBeforeDiscount));

        if (discountPercentage > 0) {
            BigDecimal discountAmount = totalBeforeDiscount.subtract(BigDecimal.valueOf(cost + flexDollarsInDollars))
                    .setScale(2, RoundingMode.HALF_UP);
            breakdown.append(String.format("Loyalty discount (%.0f%%): -$%.2f CAD\n",
                    discountPercentage * 100, discountAmount));
        }

        if (flexDollarsUsed > 0) {
            breakdown.append(String.format("Flex dollars applied: -%d flex dollars ($%.2f CAD)\n",
                    flexDollarsUsed, flexDollarsInDollars));
        }

        breakdown.append(String.format("Final cost: $%.2f CAD", Math.max(0, finalCost)));

        return breakdown.toString();
    }

    // Maintain backward compatibility for existing calls
    public String generateCostBreakdown(Long userId, String bikeType, double durationMinutes, double cost) {
        return generateCostBreakdown(userId, bikeType, durationMinutes, cost, 0);
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