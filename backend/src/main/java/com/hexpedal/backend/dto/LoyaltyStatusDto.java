package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.LoyaltyTier;
import com.hexpedal.backend.model.RiderLoyalty;

import java.time.Instant;

public record LoyaltyStatusDto(
        LoyaltyTier currentTier,
        LoyaltyTier previousTier,
        double discountPercentage,
        int reservationHoldMinutes,
        int totalTrips,
        int tripsLastYear,
        int missedReservationsLastYear,
        int successfulClaimedReservationsLastYear,
        boolean hasNotification,
        boolean upgraded,
        boolean downgraded,
        Instant tierChangedAt,
        TierProgressDto progress
) {
    public static LoyaltyStatusDto from(RiderLoyalty loyalty, TierProgressDto progress) {
        return new LoyaltyStatusDto(
                loyalty.getCurrentTier(),
                loyalty.getPreviousTier(),
                loyalty.getDiscountPercentage(),
                loyalty.getReservationHoldMinutes(),
                loyalty.getTotalTrips(),
                loyalty.getTripsLastYear(),
                loyalty.getMissedReservationsLastYear(),
                loyalty.getSuccessfulClaimedReservationsLastYear(),
                !loyalty.isLastTierNotificationShown() &&
                        loyalty.getCurrentTier() != loyalty.getPreviousTier(),
                loyalty.hasUpgraded(),
                loyalty.hasDowngraded(),
                loyalty.getTierChangedAt(),
                progress
        );
    }
}
