package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.CostEstimateDto;
import com.hexpedal.backend.model.LoyaltyTier;
import com.hexpedal.backend.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping("/plans")
    public ResponseEntity<List<PricingService.PricingPlanInfo>> getAllPricingPlans() {
        List<PricingService.PricingPlanInfo> plans = pricingService.getAllPricingPlans();
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/tiers")
    public ResponseEntity<List<PricingService.LoyaltyTierInfo>> getAllTiers() {
        List<PricingService.LoyaltyTierInfo> tiers = pricingService.getAllTiers();
        return ResponseEntity.ok(tiers);
    }

    @GetMapping("/calculate")
    public ResponseEntity<CostEstimateDto> estimateCost(
            @RequestParam String bikeType,
            @RequestParam double durationMinutes,
            @RequestParam(required = false) String tier) {

        if (durationMinutes < 0) {
            return ResponseEntity.badRequest().build();
        }

        LoyaltyTier loyaltyTier = LoyaltyTier.NONE;
        if (tier != null) {
            try {
                loyaltyTier = LoyaltyTier.valueOf(tier.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid tier, use NONE
            }
        }

        CostEstimateDto estimate = pricingService.estimateTripCostWithTier(
                bikeType,
                durationMinutes,
                loyaltyTier
        );
        return ResponseEntity.ok(estimate);
    }

    @GetMapping("/plans/{bikeType}")
    public ResponseEntity<?> getPlanDetails(@PathVariable String bikeType) {
        var plans = pricingService.getAllPricingPlans();
        var plan = plans.stream()
                .filter(p -> p.bikeType().equalsIgnoreCase(bikeType))
                .findFirst();

        if (plan.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(plan.get());
    }
}