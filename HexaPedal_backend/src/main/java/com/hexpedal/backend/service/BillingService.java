package com.hexpedal.backend.service;

import com.hexpedal.backend.model.BikePricingPlan;
import com.hexpedal.backend.model.Operator;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.repository.UserRepository;
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
    private final UserRepository userRepository;

    private static final double OPERATOR_DISCOUNT_PERCENTAGE = 0.50; // 50% discount for operators

    @Transactional
    public double calculateTripCost(Long userId, String bikeType, double durationMinutes) {
        BikePricingPlan plan = BikePricingPlan.fromBikeType(bikeType);
        BigDecimal totalCost = plan.calculateCost(durationMinutes)
                .setScale(2, RoundingMode.HALF_UP);

   
        double costAfterLoyalty = loyaltyService.applyDiscount(userId, totalCost.doubleValue());

      
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        if (user instanceof Operator) {
          
            costAfterLoyalty = costAfterLoyalty * (1 - OPERATOR_DISCOUNT_PERCENTAGE);
        }

        return Math.round(costAfterLoyalty * 100.0) / 100.0; 
    }

    public String generateCostBreakdown(Long userId, String bikeType, double durationMinutes, double finalCost) {
        BikePricingPlan plan = BikePricingPlan.fromBikeType(bikeType);

        BigDecimal baseFee = plan.getBaseFee();
        BigDecimal ratePerMinute = plan.getRatePerMinute();
        BigDecimal duration = BigDecimal.valueOf(durationMinutes);
        BigDecimal timeCost = ratePerMinute.multiply(duration).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalBeforeDiscount = baseFee.add(timeCost);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        boolean isOperator = user instanceof Operator;
        double loyaltyDiscountPercentage = loyaltyService.getOrCreateLoyalty(user).getDiscountPercentage();

        StringBuilder breakdown = new StringBuilder();
        breakdown.append(String.format("Bike Type: %s\n", plan.getBikeType()));
        breakdown.append(String.format("Base Fee: $%.2f CAD\n", baseFee));
        breakdown.append(String.format("Time: %.1f minutes × $%.2f/minute = $%.2f CAD\n",
                durationMinutes, ratePerMinute, timeCost));
        breakdown.append(String.format("Subtotal: $%.2f CAD\n", totalBeforeDiscount));

        BigDecimal costAfterLoyalty = totalBeforeDiscount;
        if (loyaltyDiscountPercentage > 0) {
            costAfterLoyalty = totalBeforeDiscount.multiply(BigDecimal.valueOf(1 - loyaltyDiscountPercentage))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal loyaltyDiscountAmount = totalBeforeDiscount.subtract(costAfterLoyalty);
            breakdown.append(String.format("Loyalty discount (%.0f%%): -$%.2f CAD\n",
                    loyaltyDiscountPercentage * 100, loyaltyDiscountAmount));
        }

        if (isOperator) {
            BigDecimal costBeforeOperatorDiscount = costAfterLoyalty;
            BigDecimal operatorDiscountAmount = costBeforeOperatorDiscount
                    .multiply(BigDecimal.valueOf(OPERATOR_DISCOUNT_PERCENTAGE))
                    .setScale(2, RoundingMode.HALF_UP);
            breakdown.append(String.format("Operator discount (%.0f%%): -$%.2f CAD\n",
                    OPERATOR_DISCOUNT_PERCENTAGE * 100, operatorDiscountAmount));
        }

        breakdown.append(String.format("Final cost: $%.2f CAD", finalCost));

        return breakdown.toString();
    }

    @Transactional
    public void updateRideCost(Integer rideId, double cost) {
        Rides ride = ridesRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        ride.setCost(cost);
        ridesRepository.save(ride);
    }

}