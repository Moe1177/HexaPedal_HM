package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.BillingHistoryDto;
import com.hexpedal.backend.dto.TripSummaryDto;
import com.hexpedal.backend.model.Rider;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import com.hexpedal.backend.service.BillingService;
import com.hexpedal.backend.service.FlexDollarService;
import com.hexpedal.backend.service.PaymentService;
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
    private final PaymentService paymentService;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final FlexDollarService flexDollarService;



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

        if (!(ride.getUser().getId() ==(user.getId()))) {
            return ResponseEntity.status(403).body("You can only view your own trip summaries");
        }

        int flexDollarsUsed = ride.getFlexDollarsUsed() != null ? ride.getFlexDollarsUsed() : 0;
        String bikeType = ride.getBike() != null ? ride.getBike().getType() : "Standard";
        String costBreakdown = billingService.generateCostBreakdown(
                user.getId(),
                bikeType,
                ride.getDuration(),
                ride.getCost(),
                flexDollarsUsed
        );

        TripSummaryDto summary = TripSummaryDto.from(ride, costBreakdown);
        return ResponseEntity.ok(summary);
    }

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

        if (!(ride.getUser().getId() ==(user.getId()))) {
            return ResponseEntity.status(403).body("You can only calculate costs for your own trips");
        }

        String bikeType = ride.getBike() != null ? ride.getBike().getType() : "Standard";
        double cost = billingService.calculateTripCost(user.getId(), bikeType, ride.getDuration());

        // Apply flex dollars to reduce the cost (same as in ReservationService)
        int flexDollarsUsed = 0;
        double finalCostToCharge = cost;

        if (cost > 0) {
            // Apply flex dollars to the trip cost
            FlexDollarService.AppliedFlexDollarsResult flexResult =
                    flexDollarService.applyFlexDollarsToTrip(user.getId(), cost);
            flexDollarsUsed = flexResult.getFlexDollarsUsed();
            finalCostToCharge = flexResult.getFinalCostToCharge();
        }

        // Update ride with final cost after flex dollars
        billingService.updateRideCost(rideId, finalCostToCharge);
        
        // Update flex dollars used if it changed
        if (flexDollarsUsed > 0) {
            ride.setFlexDollarsUsed(flexDollarsUsed);
            ridesRepository.save(ride);
        }

        return ResponseEntity.ok(new CostResponse(finalCostToCharge, "Cost calculated successfully"));
    }

    private record CostResponse(double cost, String message) {}
}