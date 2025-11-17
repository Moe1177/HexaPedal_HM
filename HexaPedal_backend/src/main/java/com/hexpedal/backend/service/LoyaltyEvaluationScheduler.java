package com.hexpedal.backend.service;

import com.hexpedal.backend.model.RiderLoyalty;
import com.hexpedal.backend.repository.RiderLoyaltyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
public class LoyaltyEvaluationScheduler {

    private final RiderLoyaltyRepository loyaltyRepo;
    private final LoyaltyService loyaltyService;

    /**
     * Evaluate all rider tiers daily at 2 AM
     * This ensures tiers are kept up-to-date based on recent activity
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void evaluateAllRiderTiers() {
        System.out.println("🔄 Starting daily loyalty tier evaluation...");

        List<RiderLoyalty> allLoyalties = loyaltyRepo.findAll();
        int upgraded = 0;
        int downgraded = 0;
        int unchanged = 0;

        for (RiderLoyalty loyalty : allLoyalties) {
            try {
                var previousTier = loyalty.getCurrentTier();
                loyaltyService.evaluateTier(loyalty.getUser().getId());

                loyalty = loyaltyRepo.findById(loyalty.getId()).orElse(loyalty);

                if (loyalty.getCurrentTier().ordinal() > previousTier.ordinal()) {
                    upgraded++;
                } else if (loyalty.getCurrentTier().ordinal() < previousTier.ordinal()) {
                    downgraded++;
                } else {
                    unchanged++;
                }
            } catch (Exception e) {
                System.err.println("Failed to evaluate tier for user " +
                        loyalty.getUser().getId() + ": " + e.getMessage());
            }
        }

        System.out.println(String.format(
                "✅ Tier evaluation complete: %d upgraded, %d downgraded, %d unchanged",
                upgraded, downgraded, unchanged
        ));
    }

    @Scheduled(cron = "0 0 3 * * SUN")
    @Transactional
    public void cleanupStaleRecords() {
        System.out.println("🧹 Cleaning up stale loyalty records...");

        Instant oneYearAgo = Instant.now().minus(365, ChronoUnit.DAYS);
        List<RiderLoyalty> allLoyalties = loyaltyRepo.findAll();
        int cleaned = 0;

        for (RiderLoyalty loyalty : allLoyalties) {
            if (loyalty.getLastEvaluatedAt() != null &&
                    loyalty.getLastEvaluatedAt().isBefore(oneYearAgo) &&
                    loyalty.getTotalTrips() == 0) {

                // Reset to NONE tier but keep the record
                loyalty.setCurrentTier(com.hexpedal.backend.model.LoyaltyTier.NONE);
                loyalty.setPreviousTier(com.hexpedal.backend.model.LoyaltyTier.NONE);
                loyaltyRepo.save(loyalty);
                cleaned++;
            }
        }

        System.out.println("Cleaned " + cleaned + " stale loyalty records");
    }
}
