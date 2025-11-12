package com.hexpedal.backend.service;

import com.hexpedal.backend.model.*;
import com.hexpedal.backend.repository.BikeRepository;
import com.hexpedal.backend.repository.RiderLoyaltyRepository;
import com.hexpedal.backend.repository.RidesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final RiderLoyaltyRepository loyaltyRepo;
    private final RidesRepository ridesRepo;
    private final BikeRepository bikeRepo;

    @Transactional
    public RiderLoyalty getOrCreateLoyalty(Rider rider) {
        return loyaltyRepo.findByRider(rider)
                .orElseGet(() -> {
                    RiderLoyalty loyalty = RiderLoyalty.builder()
                            .rider(rider)
                            .currentTier(LoyaltyTier.NONE)
                            .previousTier(LoyaltyTier.NONE)
                            .build();
                    return loyaltyRepo.save(loyalty);
                });
    }

    @Transactional
    public RiderLoyalty evaluateTier(Long riderId) {
        Rider rider = new Rider();
        rider.setId(riderId);

        RiderLoyalty loyalty = getOrCreateLoyalty(rider);

        // Update statistics
        updateStatistics(loyalty, riderId);

        // Determine new tier
        LoyaltyTier newTier = calculateTier(loyalty, riderId);

        if (newTier != loyalty.getCurrentTier()) {
            if (newTier.ordinal() > loyalty.getCurrentTier().ordinal()) {
                loyalty.upgradeTier(newTier);
            } else {
                loyalty.downgradeTier(newTier);
            }
        }

        loyalty.setLastEvaluatedAt(Instant.now());
        return loyaltyRepo.save(loyalty);
    }

    private void updateStatistics(RiderLoyalty loyalty, Long riderId) {
        Instant oneYearAgo = Instant.now().minus(365, ChronoUnit.DAYS);

        List<Rides> allRides = ridesRepo.findByUserId(Math.toIntExact(riderId));
        List<Rides> ridesLastYear = allRides.stream()
                .filter(r -> r.getStartTimestamp().isAfter(oneYearAgo))
                .toList();

        loyalty.setTotalTrips(allRides.size());
        loyalty.setTripsLastYear(ridesLastYear.size());
        loyalty.setTotalSuccessfulReturns(allRides.size());

        // Count missed reservations (bikes that were reserved but never used)
        List<Bike> allBikesReservedByUser = bikeRepo.findAll().stream()
                .filter(b -> b.getCurrentUser() != null && b.getCurrentUser().getId() == riderId)
                .toList();

        int missedCount = 0;
        for (Bike bike : allBikesReservedByUser) {
            if (bike.isReservationExpired() && bike.getBikeStatus() == BikeStatus.reserved) {
                LocalDateTime reservationTime = LocalDateTime.of(
                        bike.getReservationExpDate(),
                        bike.getReservationExpTime()
                );
                if (reservationTime.isAfter(LocalDateTime.now().minusYears(1))) {
                    missedCount++;
                }
            }
        }
        loyalty.setMissedReservationsLastYear(missedCount);

        // Count successful claimed reservations (reservations that led to trips)
        int successfulClaimed = (int) ridesLastYear.stream()
                .filter(r -> r.getBike() != null)
                .count();
        loyalty.setSuccessfulClaimedReservationsLastYear(successfulClaimed);
    }

    private LoyaltyTier calculateTier(RiderLoyalty loyalty, Long riderId) {
        // Check Gold tier (GL-001, GL-002, GL-003)
        if (meetsGoldCriteria(loyalty, riderId)) {
            return LoyaltyTier.GOLD;
        }

        // Check Silver tier (SL-001, SL-002, SL-003, SL-004)
        if (meetsSilverCriteria(loyalty, riderId)) {
            return LoyaltyTier.SILVER;
        }

        // Check Bronze tier (BR-001, BR-002, BR-003, BR-004)
        if (meetsBronzeCriteria(loyalty)) {
            return LoyaltyTier.BRONZE;
        }

        return LoyaltyTier.NONE;
    }

    private boolean meetsBronzeCriteria(RiderLoyalty loyalty) {
        // BR-001: No missed reservations within last year
        if (loyalty.getMissedReservationsLastYear() > 0) {
            return false;
        }

        // BR-002: Returned all bikes successfully
        if (loyalty.getTotalTrips() != loyalty.getTotalSuccessfulReturns()) {
            return false;
        }

        // BR-003: Surpassed 10 trips in the last year
        if (loyalty.getTripsLastYear() < 10) {
            return false;
        }

        return true;
    }

    private boolean meetsSilverCriteria(RiderLoyalty loyalty, Long riderId) {
        // SL-001: Must meet Bronze tier eligibility
        if (!meetsBronzeCriteria(loyalty)) {
            return false;
        }

        // SL-002: At least 5 successful claimed reservations last year
        if (loyalty.getSuccessfulClaimedReservationsLastYear() < 5) {
            return false;
        }

        // SL-003: Surpassed 5 trips per month for last 3 months
        if (!meetsMonthlyTripRequirement(riderId, 5, 3)) {
            return false;
        }

        return true;
    }

    private boolean meetsGoldCriteria(RiderLoyalty loyalty, Long riderId) {
        // GL-001: Must meet Silver tier eligibility
        if (!meetsSilverCriteria(loyalty, riderId)) {
            return false;
        }

        // GL-002: Surpasses 5 trips every week for last 3 months
        if (!meetsWeeklyTripRequirement(riderId, 5, 12)) { // 12 weeks = 3 months
            return false;
        }

        return true;
    }

    private boolean meetsMonthlyTripRequirement(Long riderId, int tripsPerMonth, int months) {
        List<Rides> allRides = ridesRepo.findByUserId(Math.toIntExact(riderId));

        for (int i = 0; i < months; i++) {
            Instant monthStart = Instant.now().minus(30L * (i + 1), ChronoUnit.DAYS);
            Instant monthEnd = Instant.now().minus(30L * i, ChronoUnit.DAYS);

            long tripsInMonth = allRides.stream()
                    .filter(r -> r.getStartTimestamp().isAfter(monthStart)
                            && r.getStartTimestamp().isBefore(monthEnd))
                    .count();

            if (tripsInMonth < tripsPerMonth) {
                return false;
            }
        }

        return true;
    }

    private boolean meetsWeeklyTripRequirement(Long riderId, int tripsPerWeek, int weeks) {
        List<Rides> allRides = ridesRepo.findByUserId(Math.toIntExact(riderId));

        for (int i = 0; i < weeks; i++) {
            Instant weekStart = Instant.now().minus(7L * (i + 1), ChronoUnit.DAYS);
            Instant weekEnd = Instant.now().minus(7L * i, ChronoUnit.DAYS);

            long tripsInWeek = allRides.stream()
                    .filter(r -> r.getStartTimestamp().isAfter(weekStart)
                            && r.getStartTimestamp().isBefore(weekEnd))
                    .count();

            if (tripsInWeek < tripsPerWeek) {
                return false;
            }
        }

        return true;
    }

    @Transactional
    public double applyDiscount(Long riderId, double originalCost) {
        RiderLoyalty loyalty = loyaltyRepo.findByRiderId(riderId)
                .orElse(null);

        if (loyalty == null || loyalty.getCurrentTier() == LoyaltyTier.NONE) {
            return originalCost;
        }

        double discount = loyalty.getDiscountPercentage();
        return originalCost * (1 - discount);
    }

    @Transactional
    public int getReservationHoldMinutes(Long riderId) {
        RiderLoyalty loyalty = loyaltyRepo.findByRiderId(riderId)
                .orElse(null);

        if (loyalty == null) {
            return LoyaltyTier.NONE.getBaseReservationMinutes();
        }

        return loyalty.getReservationHoldMinutes();
    }

    @Transactional
    public void markNotificationShown(Long riderId) {
        loyaltyRepo.findByRiderId(riderId).ifPresent(loyalty -> {
            loyalty.setLastTierNotificationShown(true);
            loyaltyRepo.save(loyalty);
        });
    }
}
