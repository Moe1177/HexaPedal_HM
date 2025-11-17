package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.BillingHistoryDto;
import com.hexpedal.backend.dto.TripSummaryDto;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import com.hexpedal.backend.service.BillingService;
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



    @GetMapping("/trip/{rideId}")
    @PreAuthorize("hasAnyRole('RIDER', 'OPERATOR')")
    public ResponseEntity<?> getTripSummary(
            @AuthenticationPrincipal User user,
            @PathVariable Integer rideId) {

        Rides ride = ridesRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!(ride.getUser().getId() ==(user.getId()))) {
            return ResponseEntity.status(403).body("You can only view your own trip summaries");
        }

        String bikeType = ride.getBike() != null ? ride.getBike().getType() : "Standard";
        String costBreakdown = billingService.generateCostBreakdown(
                user.getId(),
                bikeType,
                ride.getDuration(),
                ride.getCost()
        );

        TripSummaryDto summary = TripSummaryDto.from(ride, costBreakdown);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('RIDER', 'OPERATOR')")
    public ResponseEntity<?> getBillingHistory(@AuthenticationPrincipal User user) {

        List<Rides> rides = ridesRepository.findByUserId(Math.toIntExact(user.getId()));

        List<BillingHistoryDto> history = rides.stream()
                .map(BillingHistoryDto::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }

    @PostMapping("/calculate-trip-cost")
    @PreAuthorize("hasAnyRole('RIDER', 'OPERATOR')")
    public ResponseEntity<?> calculateTripCost(
            @AuthenticationPrincipal User user,
            @RequestParam Integer rideId) {

        Rides ride = ridesRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!(ride.getUser().getId() ==(user.getId()))) {
            return ResponseEntity.status(403).body("You can only calculate costs for your own trips");
        }

        String bikeType = ride.getBike() != null ? ride.getBike().getType() : "Standard";
        double cost = billingService.calculateTripCost(user.getId(), bikeType, ride.getDuration());


        billingService.updateRideCost(rideId, cost);

        return ResponseEntity.ok(new CostResponse(cost, "Cost calculated successfully"));
    }

    private record CostResponse(double cost, String message) {}
}

