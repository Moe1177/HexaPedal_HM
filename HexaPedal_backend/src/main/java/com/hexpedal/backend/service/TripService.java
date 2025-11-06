package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.TripSummaryDTO;
import com.hexpedal.backend.model.*;
import com.hexpedal.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TripService {

    private final RidesRepository tripRepository;
    private final PricingPlanRepository pricingPlanRepository;
    private final BillingRecordRepository billingRecordRepository;
    private final TripCostCalculator costCalculator;

    /**
     * Start a new trip
     */
    @Transactional
    public Rides startTrip(User user, Bike bike, String originStation) {
        // Get active pricing plan for user (defaulting to system default)
        PricingPlan plan = pricingPlanRepository.findByDefaultPlanTrue()
                .orElseThrow(() -> new IllegalStateException("No default pricing plan configured"));

        Rides trip = Rides.builder()
                .user(user)
                .bike(bike)
                .startLocation(originStation)
                .startTimestamp(Instant.now())
                .rideStatus(RideStatus.IN_PROGRESS)
                .pricingPlan(plan)
                .build();

        return tripRepository.save(trip);
    }

    /**
     * End a trip and calculate costs
     */
    @Transactional
    public TripSummaryDTO endTrip(int tripId, String destinationStation) {
        Rides trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        if (trip.getRideStatus() != RideStatus.IN_PROGRESS) {
            throw new IllegalStateException("Trip is not in progress");
        }

        // Set end time and destination
        trip.setEndTimestamp(Instant.now());
        trip.setEndLocation(destinationStation);
        trip.calculateDuration();
        trip.setRideStatus(RideStatus.COMPLETED);

        // Calculate cost
        TripCostCalculator.CostBreakdown breakdown =
                costCalculator.calculateTripCost(trip, trip.getPricingPlan());

        trip.setBaseFee(breakdown.getBaseFee());
        trip.setTimeFee(breakdown.getTimeFee());
        trip.setLateFee(breakdown.getLateFee());
        trip.setTotalCost(breakdown.getTotalCost());
        trip.setCostBreakdown(breakdown.getDetails());

        trip = tripRepository.save(trip);

        // Create billing record
        createBillingRecord(trip);

        // Return trip summary
        return buildTripSummary(trip, breakdown);
    }

    /**
     * Get trip history for a user
     */
    public List<Rides> getUserTripHistory(Long userId) {
        return tripRepository.findByUserIdOrderByStartTimeDesc(userId);
    }

    /**
     * Get billing history for a user
     */
    public List<BillingRecord> getUserBillingHistory(Long userId) {
        return billingRecordRepository.findByUserIdOrderByBillingDateDesc(userId);
    }

    /**
     * Get active trip for a user
     */
    public Rides getActiveTrip(Long userId) {
        return tripRepository.findByUserIdAndStatus(userId, RideStatus.IN_PROGRESS)
                .orElse(null);
    }

    private void createBillingRecord(Rides trip) {
        BillingRecord billing = BillingRecord.builder()
                .user(trip.getUser())
                .trip(trip)
                .billingDate(LocalDateTime.now())
                .amount(trip.getTotalCost())
                .status(BillingStatus.PENDING)
                .chargeDetails(trip.getCostBreakdown())
                .build();

        billingRecordRepository.save(billing);
    }

    private TripSummaryDTO buildTripSummary(Rides trip, TripCostCalculator.CostBreakdown breakdown) {
        return TripSummaryDTO.builder()
                .tripId((long)trip.getRide_id())
                .bikeId(trip.getBike().getId())
                .bikeType(trip.getBike().getType())
                .originStationName(trip.getStartLocation())
                .originStationAddress(trip.getEndLocation())
                .destinationStationName(trip.getEndLocation())
                .destinationStationAddress(trip.getEndLocation())
                .startTime(LocalDateTime.from(trip.getStartTimestamp()))
                .endTime(LocalDateTime.from(trip.getEndTimestamp()))
                .durationMinutes((long) trip.getDuration())
                .baseFee(breakdown.getBaseFee())
                .timeFee(breakdown.getTimeFee())
                .totalCost(breakdown.getTotalCost())
                .costBreakdown(breakdown.getDetails())
                .pricingPlanName(trip.getPricingPlan().getName())
                .build();
    }
}
