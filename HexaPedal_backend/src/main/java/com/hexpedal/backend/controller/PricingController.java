package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.CostEstimateDto;
import com.hexpedal.backend.dto.PricingPlanDto;
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

    /**
     * Get all available pricing plans - public access (R-PRC-01)
     */
    @GetMapping("/plans")
    public ResponseEntity<List<PricingPlanDto>> getAllPricingPlans() {
        List<PricingPlanDto> plans = pricingService.getAllActivePricingPlans();
        return ResponseEntity.ok(plans);
    }

    /**
     * Estimate trip cost based on distance - public access
     */
    @GetMapping("/calculate")
    public ResponseEntity<CostEstimateDto> estimateCost(@RequestParam double distanceKm) {
        if (distanceKm < 0) {
            return ResponseEntity.badRequest().build();
        }
        CostEstimateDto estimate = pricingService.estimateTripCost(distanceKm);
        return ResponseEntity.ok(estimate);
    }
}

