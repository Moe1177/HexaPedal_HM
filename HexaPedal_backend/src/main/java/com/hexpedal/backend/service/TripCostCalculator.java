package com.hexpedal.backend.service;

import com.hexpedal.backend.model.PricingPlan;
import com.hexpedal.backend.model.Rides;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
public class TripCostCalculator {

    @Getter
    @Builder
    public static class CostBreakdown {
        private double baseFee;
        private double timeFee;
        private double lateFee;
        private double totalCost;
        private long totalMinutes;
        private long billableMinutes;
        private long lateMinutes;
        private String details;
    }


    public CostBreakdown calculateTripCost(Rides trip, PricingPlan plan) {
        if (trip.getStartTimestamp() == null || trip.getEndTimestamp() == null) {
            throw new IllegalArgumentException("Trip must have start and end times");
        }

        long totalMinutes = Duration.between(trip.getStartTimestamp(), trip.getEndTimestamp()).toMinutes();

        // Calculate base fee
        double baseFee = plan.getBaseFee();

        // Calculate time fee
        long billableMinutes = calculateBillableMinutes(totalMinutes, plan.getFreeMinutes());
        double timeFee = billableMinutes * plan.getPerMinuteFee();


        // Calculate total
        double totalCost = baseFee + timeFee;

        // Apply maximum cost cap if specified
        if (plan.getMaxCostPerTrip() != null && totalCost > plan.getMaxCostPerTrip()) {
            totalCost = plan.getMaxCostPerTrip();
        }

        // Ensure non-negative cost
        totalCost = Math.max(0, totalCost);

        // Build detailed breakdown
        String details = buildCostDetails(plan, totalMinutes, billableMinutes, baseFee, timeFee, totalCost);

        return CostBreakdown.builder()
                .baseFee((long) baseFee)
                .timeFee(timeFee)
                .totalCost(totalCost)
                .totalMinutes(totalMinutes)
                .billableMinutes(billableMinutes)
                .details(details)
                .build();
    }

    private long calculateBillableMinutes(long totalMinutes, Integer freeMinutes) {
        if (freeMinutes == null || freeMinutes <= 0) {
            return totalMinutes;
        }
        return Math.max(0, totalMinutes - freeMinutes);
    }


    private String buildCostDetails(PricingPlan plan, long totalMinutes, long billableMinutes,
                                    double baseFee, double timeFee,
                                    double totalCost) {
        StringBuilder sb = new StringBuilder();
        sb.append("Plan: ").append(plan.getName()).append("\n");
        sb.append("Trip Duration: ").append(totalMinutes).append(" minutes\n\n");

        sb.append("Base Fee: $").append(String.format("%.2f", baseFee)).append("\n");

        if (plan.getFreeMinutes() != null && plan.getFreeMinutes() > 0) {
            sb.append("Free Minutes: ").append(plan.getFreeMinutes()).append("\n");
        }

        if (billableMinutes > 0) {
            sb.append("Billable Minutes: ").append(billableMinutes)
                    .append(" × $").append(String.format("%.2f", plan.getPerMinuteFee()))
                    .append(" = $").append(String.format("%.2f", timeFee)).append("\n");
        }

        if (plan.getMaxCostPerTrip() != null) {
            sb.append("Max Trip Cost: $").append(String.format("%.2f", plan.getMaxCostPerTrip())).append("\n");
        }

        sb.append("\nTotal Cost: $").append(String.format("%.2f", totalCost));

        return sb.toString();
    }
}