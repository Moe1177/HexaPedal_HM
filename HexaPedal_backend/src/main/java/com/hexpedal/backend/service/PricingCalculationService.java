package com.hexpedal.backend.service;

import org.springframework.stereotype.Service;

import com.hexpedal.backend.model.SubscriptionPlan;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class PricingCalculationService {

 
    public TripCostDetails calculateCost(SubscriptionPlan plan, double durationMinutes) {
        double baseFee = plan.getBaseFee();
        double perMinuteRate = plan.getPerMinuteRate();

        double timeCharge = durationMinutes * perMinuteRate;

        double totalCost = baseFee + timeCharge;

        totalCost = Math.max(0.0, totalCost);
        timeCharge = Math.max(0.0, timeCharge);

        return TripCostDetails.builder()
                .baseFee(baseFee)
                .timeCharge(timeCharge)
                .distanceCharge(0.0)
                .totalCost(totalCost)
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class TripCostDetails {
        private double baseFee;
        private double timeCharge;
        private double distanceCharge;
        private double totalCost;
    }
}

