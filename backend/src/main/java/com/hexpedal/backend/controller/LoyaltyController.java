package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.LoyaltyStatusDto;
import com.hexpedal.backend.dto.TierProgressDto;
import com.hexpedal.backend.model.RiderLoyalty;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.UserRepository;
import com.hexpedal.backend.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;
    private final UserRepository userRepository;

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('RIDER', 'OPERATOR')")
    public ResponseEntity<?> getLoyaltyStatus(@AuthenticationPrincipal User user) {
        try {
            RiderLoyalty loyalty = loyaltyService.evaluateTier(user.getId());
            TierProgressDto progress = loyaltyService.calculateTierProgress(user.getId());

            return ResponseEntity.ok(LoyaltyStatusDto.from(loyalty, progress));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Failed to fetch loyalty status: " + e.getMessage());
        }
    }

    @GetMapping("/progress/{userId}")
    public ResponseEntity<TierProgressDto> getTierProgress(@PathVariable Long userId) {
        TierProgressDto progress = loyaltyService.calculateTierProgress(userId);
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/evaluate")
    @PreAuthorize("hasAnyRole('RIDER', 'OPERATOR')")
    public ResponseEntity<LoyaltyStatusDto> evaluateTier(Authentication authentication) {
        String email = authentication.getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        RiderLoyalty loyalty = loyaltyService.evaluateTier(user.getId());
        TierProgressDto progress = loyaltyService.calculateTierProgress(user.getId());
        return ResponseEntity.ok(LoyaltyStatusDto.from(loyalty, progress));
    }

    @PostMapping("/notification/dismiss")
    @PreAuthorize("hasAnyRole('RIDER', 'OPERATOR')")
    public ResponseEntity<?> dismissNotification(@AuthenticationPrincipal User user) {
        loyaltyService.markNotificationShown(user.getId());
        return ResponseEntity.ok().body("Notification dismissed");
    }

    @PostMapping("/notification/acknowledge")
    public ResponseEntity<Void> acknowledgeNotification(Authentication authentication) {
        String email = authentication.getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        loyaltyService.markNotificationShown(user.getId());
        return ResponseEntity.ok().build();
    }
}