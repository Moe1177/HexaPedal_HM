package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.BillingHistoryDto;
import com.hexpedal.backend.dto.TripSummaryDto;
import com.hexpedal.backend.model.Rider;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;
    private final RidesRepository ridesRepository;

    /**
     * Get trip summary with cost breakdown - Rider only (R-PRC-03)
     */
    @GetMapping("/trip/{rideId}")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> getTripSummary(
            @AuthenticationPrincipal User user,
            @PathVariable Integer rideId) {
        
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can view billing information");
        }

        Rides ride = ridesRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        // Verify the ride belongs to the authenticated user
        if (!ride.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("You can only view your own trip summaries");
        }

        String costBreakdown = billingService.generateCostBreakdown(
                user.getId(),
                ride.getDuration(),
                ride.getCost()
        );

        TripSummaryDto summary = TripSummaryDto.from(ride, costBreakdown);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get billing history with all trip details - Rider only (R-PRC-04, R-PRC-05)
     * Provides: start date/time, bike id, origin station, arrival station, charges
     */
    @GetMapping("/history")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> getBillingHistory(@AuthenticationPrincipal User user) {
        
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can view billing history");
        }

        List<Rides> rides = ridesRepository.findByUserId(Math.toIntExact(user.getId()));
        
        List<BillingHistoryDto> history = rides.stream()
                .map(BillingHistoryDto::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }

    /**
     * Calculate cost for a trip (typically called when trip ends)
     */
    @PostMapping("/calculate-trip-cost")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> calculateTripCost(
            @AuthenticationPrincipal User user,
            @RequestParam Integer rideId) {
        
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can calculate trip costs");
        }

        Rides ride = ridesRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        // Verify the ride belongs to the authenticated user
        if (!ride.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("You can only calculate costs for your own trips");
        }

        // Calculate cost based on user's subscription status
        double cost = billingService.calculateTripCost(user.getId(), ride.getDistance());
        
        // Update ride with calculated cost
        billingService.updateRideCost(rideId, cost);

        return ResponseEntity.ok(new CostResponse(cost, "Cost calculated successfully"));
    }

    // Simple response record
    private record CostResponse(double cost, String message) {}
}

