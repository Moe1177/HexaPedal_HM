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

    @GetMapping("/plans")
    public ResponseEntity<List<PricingPlanDto>> getAllPricingPlans() {
        List<PricingPlanDto> plans = pricingService.getAllActivePricingPlans();
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/calculate")
    public ResponseEntity<CostEstimateDto> estimateCost(@RequestParam double durationMinutes) {
        if (durationMinutes < 0) {
            return ResponseEntity.badRequest().build();
        }
        CostEstimateDto estimate = pricingService.estimateTripCost(durationMinutes);
        return ResponseEntity.ok(estimate);
    }
}

