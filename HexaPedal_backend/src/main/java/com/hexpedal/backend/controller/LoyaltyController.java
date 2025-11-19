package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.LoyaltyStatusDto;
import com.hexpedal.backend.dto.TierProgressDto;
import com.hexpedal.backend.model.Rider;
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
    public ResponseEntity<LoyaltyStatusDto> getLoyaltyStatus(Authentication authentication) {
        String email = authentication.getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        RiderLoyalty loyalty = loyaltyService.evaluateTier(user.getId());
        TierProgressDto progress = loyaltyService.calculateTierProgress(user.getId());

        return ResponseEntity.ok(LoyaltyStatusDto.from(loyalty, progress));
    }

    @GetMapping("/progress/{userId}")
    public ResponseEntity<TierProgressDto> getTierProgress(@PathVariable Long userId) {
        TierProgressDto progress = loyaltyService.calculateTierProgress(userId);
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/evaluate")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<LoyaltyStatusDto> evaluateTier(Authentication authentication) {
        String email = authentication.getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        RiderLoyalty loyalty = loyaltyService.evaluateTier(user.getId());
        TierProgressDto progress = loyaltyService.calculateTierProgress(user.getId());
        return ResponseEntity.ok(LoyaltyStatusDto.from(loyalty, progress));
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

    @PostMapping("/notification/acknowledge")
    public ResponseEntity<Void> acknowledgeNotification(Authentication authentication) {
        String email = authentication.getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        loyaltyService.markNotificationShown(user.getId());
        return ResponseEntity.ok().build();
    }
}