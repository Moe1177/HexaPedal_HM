package com.hexpedal.backend.service;

import com.hexpedal.backend.model.PlanType;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.SubscriptionPlan;
import com.hexpedal.backend.model.UserSubscription;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.repository.SubscriptionPlanRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final RidesRepository ridesRepository;

    /**
     * Calculate trip cost deterministically based on plan rules and trip facts (R-PRC-02)
     * 
     * Rules:
     * - Active subscription (Monthly/Yearly): $0.00 per trip (unlimited rides)
     * - No subscription (Pay-per-trip): $0.01 CAD per minute
     */
    @Transactional
    public double calculateTripCost(Long userId, double durationMinutes) {
        // Check if user has an active subscription
        Optional<UserSubscription> activeSubscription = 
                userSubscriptionRepository.findActiveSubscriptionByUserId(userId);

        if (activeSubscription.isPresent()) {
            PlanType planType = activeSubscription.get().getPlan().getPlanType();
            // Monthly and Yearly subscriptions get unlimited rides at no cost per trip
            if (planType == PlanType.MONTHLY || planType == PlanType.YEARLY) {
                return 0.00;
            }
        }

        // Pay-per-trip calculation: $0.01 CAD per minute
        SubscriptionPlan payPerTripPlan = subscriptionPlanRepository.findByPlanType(PlanType.PAY_PER_TRIP)
                .orElseThrow(() -> new RuntimeException("Pay-per-trip plan not configured"));

        BigDecimal ratePerMinute = payPerTripPlan.getRatePerMinute();
        BigDecimal duration = BigDecimal.valueOf(durationMinutes);
        BigDecimal cost = ratePerMinute.multiply(duration).setScale(2, RoundingMode.HALF_UP);

        return cost.doubleValue();
    }

    /**
     * Generate a human-readable cost breakdown for a trip
     */
    public String generateCostBreakdown(Long userId, double durationMinutes, double cost) {
        Optional<UserSubscription> activeSubscription = 
                userSubscriptionRepository.findActiveSubscriptionByUserId(userId);

        if (activeSubscription.isPresent()) {
            PlanType planType = activeSubscription.get().getPlan().getPlanType();
            if (planType == PlanType.MONTHLY) {
                return "Monthly Subscription: Unlimited rides included - $0.00";
            } else if (planType == PlanType.YEARLY) {
                return "Yearly Subscription: Unlimited rides included - $0.00";
            }
        }

        // Pay-per-trip breakdown
        return String.format("Pay-per-trip: %.1f minutes × $0.01/minute = $%.2f CAD", durationMinutes, cost);
    }

    /**
     * Update the cost of an existing ride
     */
    @Transactional
    public void updateRideCost(Integer rideId, double cost) {
        Rides ride = ridesRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        ride.setCost(cost);
        ridesRepository.save(ride);
    }
}

