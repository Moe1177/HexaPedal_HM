package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.LoyaltyStatusDto;
import com.hexpedal.backend.dto.TierProgressDto;
import com.hexpedal.backend.model.Rider;
import com.hexpedal.backend.model.RiderLoyalty;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/status")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> getLoyaltyStatus(@AuthenticationPrincipal User user) {
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can view loyalty status");
        }

        RiderLoyalty loyalty = loyaltyService.getOrCreateLoyalty((Rider) user);

        // Calculate progress toward next tier
        TierProgressDto progress = calculateProgress(loyalty);

        LoyaltyStatusDto statusDto = LoyaltyStatusDto.from(loyalty, progress);
        return ResponseEntity.ok(statusDto);
    }

    @PostMapping("/evaluate")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> evaluateTier(@AuthenticationPrincipal User user) {
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can evaluate tier");
        }

        RiderLoyalty loyalty = loyaltyService.evaluateTier(user.getId());
        TierProgressDto progress = calculateProgress(loyalty);
        LoyaltyStatusDto statusDto = LoyaltyStatusDto.from(loyalty, progress);

        return ResponseEntity.ok(statusDto);
    }

    @PostMapping("/notification/dismiss")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<?> dismissNotification(@AuthenticationPrincipal User user) {
        if (!(user instanceof Rider)) {
            return ResponseEntity.status(403).body("Only riders can dismiss notifications");
        }

        loyaltyService.markNotificationShown(user.getId());
        return ResponseEntity.ok().body("Notification dismissed");
    }

    private TierProgressDto calculateProgress(RiderLoyalty loyalty) {
        // This is a simplified version - you might want to expand this
        return new TierProgressDto(
                null, // nextTier
                null, // nextTierName
                false, // canUpgrade
                java.util.List.of() // missingCriteria
        );
    }
}