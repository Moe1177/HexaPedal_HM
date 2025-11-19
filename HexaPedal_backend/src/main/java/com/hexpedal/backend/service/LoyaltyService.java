package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CriteriaStatusDto;
import com.hexpedal.backend.dto.TierProgressDto;
import com.hexpedal.backend.model.*;
import com.hexpedal.backend.repository.RiderLoyaltyRepository;
import com.hexpedal.backend.repository.RiderRepository;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.repository.ReservationHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final RiderLoyaltyRepository loyaltyRepo;
    private final RidesRepository ridesRepo;
    private final ReservationHistoryRepository reservationHistoryRepo;
    private final RiderRepository riderRepo;

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

        Rider rider = riderRepo.findById(riderId)
                .orElseThrow(() -> new EntityNotFoundException("Rider not found: " + riderId));

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

    @Transactional
    public TierProgressDto calculateTierProgress(Long riderId) {
        Rider rider = riderRepo.findById(riderId)
                .orElseThrow(() -> new EntityNotFoundException("Rider not found: " + riderId));

        RiderLoyalty loyalty = getOrCreateLoyalty(rider);
        updateStatistics(loyalty, riderId);

        LoyaltyTier currentTier = loyalty.getCurrentTier();
        LoyaltyTier nextTier = getNextTier(currentTier);

        if (nextTier == null) {
            return new TierProgressDto(
                    null,
                    "Maximum tier reached",
                    false,
                    List.of()
            );
        }

        List<CriteriaStatusDto> missingCriteria = checkTierCriteria(loyalty, riderId, nextTier);
        boolean canUpgrade = missingCriteria.stream().allMatch(CriteriaStatusDto::met);

        return new TierProgressDto(
                nextTier,
                nextTier.name(),
                canUpgrade,
                missingCriteria
        );
    }

    private LoyaltyTier getNextTier(LoyaltyTier current) {
        return switch (current) {
            case NONE -> LoyaltyTier.BRONZE;
            case BRONZE -> LoyaltyTier.SILVER;
            case SILVER -> LoyaltyTier.GOLD;
            case GOLD -> null;
        };
    }

    private List<CriteriaStatusDto> checkTierCriteria(RiderLoyalty loyalty, Long riderId, LoyaltyTier targetTier) {
        List<CriteriaStatusDto> criteria = new ArrayList<>();

        switch (targetTier) {
            case NONE -> {
                // No criteria for NONE tier
            }
            case BRONZE -> criteria.addAll(checkBronzeCriteria(loyalty));
            case SILVER -> {
                criteria.addAll(checkBronzeCriteria(loyalty));
                criteria.addAll(checkSilverSpecificCriteria(loyalty, riderId));
            }
            case GOLD -> {
                criteria.addAll(checkBronzeCriteria(loyalty));
                criteria.addAll(checkSilverSpecificCriteria(loyalty, riderId));
                criteria.addAll(checkGoldSpecificCriteria(riderId));
            }
        }

        return criteria;
    }

    private List<CriteriaStatusDto> checkBronzeCriteria(RiderLoyalty loyalty) {
        List<CriteriaStatusDto> criteria = new ArrayList<>();

        // BR-001: No missed reservations
        int missedReservations = loyalty.getMissedReservationsLastYear();
        if (missedReservations == 0) {
            criteria.add(CriteriaStatusDto.met(
                    "BR-001",
                    "No missed reservations in the last year"
            ));
        } else {
            criteria.add(CriteriaStatusDto.notMet(
                    "BR-001",
                    "No missed reservations in the last year",
                    String.format("%d missed reservation(s) - must be 0", missedReservations)
            ));
        }

        // BR-002: All bikes returned successfully
        boolean allReturned = loyalty.getTotalTrips() == loyalty.getTotalSuccessfulReturns();
        if (allReturned) {
            criteria.add(CriteriaStatusDto.met(
                    "BR-002",
                    "All bikes returned successfully"
            ));
        } else {
            int unreturned = loyalty.getTotalTrips() - loyalty.getTotalSuccessfulReturns();
            criteria.add(CriteriaStatusDto.notMet(
                    "BR-002",
                    "All bikes returned successfully",
                    String.format("%d bike(s) not returned properly", unreturned)
            ));
        }

        // BR-003: At least 10 trips in last year
        int tripsLastYear = loyalty.getTripsLastYear();
        if (tripsLastYear >= 10) {
            criteria.add(CriteriaStatusDto.met(
                    "BR-003",
                    "Complete 10 trips in the last year"
            ));
        } else {
            criteria.add(CriteriaStatusDto.notMet(
                    "BR-003",
                    "Complete 10 trips in the last year",
                    String.format("%d/%d trips completed", tripsLastYear, 10)
            ));
        }

        return criteria;
    }

    private List<CriteriaStatusDto> checkSilverSpecificCriteria(RiderLoyalty loyalty, Long riderId) {
        List<CriteriaStatusDto> criteria = new ArrayList<>();

        // SL-002: At least 5 successful claimed reservations
        int claimedReservations = loyalty.getSuccessfulClaimedReservationsLastYear();
        if (claimedReservations >= 5) {
            criteria.add(CriteriaStatusDto.met(
                    "SL-002",
                    "Successfully claim 5 reservations in the last year"
            ));
        } else {
            criteria.add(CriteriaStatusDto.notMet(
                    "SL-002",
                    "Successfully claim 5 reservations in the last year",
                    String.format("%d/%d reservations claimed", claimedReservations, 5)
            ));
        }

        // SL-003: 5 trips per month for last 3 months
        MonthlyProgress monthlyProgress = calculateMonthlyProgress(riderId, 5, 3);
        if (monthlyProgress.allMonthsMet()) {
            criteria.add(CriteriaStatusDto.met(
                    "SL-003",
                    "Complete 5 trips per month for 3 consecutive months"
            ));
        } else {
            criteria.add(CriteriaStatusDto.notMet(
                    "SL-003",
                    "Complete 5 trips per month for 3 consecutive months",
                    formatMonthlyProgress(monthlyProgress)
            ));
        }

        return criteria;
    }

    private List<CriteriaStatusDto> checkGoldSpecificCriteria(Long riderId) {
        List<CriteriaStatusDto> criteria = new ArrayList<>();

        // GL-002: 5 trips per week for last 12 weeks (3 months)
        WeeklyProgress weeklyProgress = calculateWeeklyProgress(riderId, 5, 12);
        if (weeklyProgress.allWeeksMet()) {
            criteria.add(CriteriaStatusDto.met(
                    "GL-002",
                    "Complete 5 trips per week for 12 consecutive weeks"
            ));
        } else {
            criteria.add(CriteriaStatusDto.notMet(
                    "GL-002",
                    "Complete 5 trips per week for 12 consecutive weeks",
                    formatWeeklyProgress(weeklyProgress)
            ));
        }

        return criteria;
    }

    private MonthlyProgress calculateMonthlyProgress(Long riderId, int requiredTrips, int months) {
        List<Rides> allRides = ridesRepo.findByUserId(Math.toIntExact(riderId));
        List<MonthData> monthDataList = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < months; i++) {
            // Start of the target month (e.g., i=0 means current month, i=1 means last month)
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

            // Start of the next month (exclusive end boundary)
            LocalDateTime monthEnd = monthStart.plusMonths(1);

            Instant monthStartInstant = monthStart.atZone(ZoneId.systemDefault()).toInstant();
            Instant monthEndInstant = monthEnd.atZone(ZoneId.systemDefault()).toInstant();

            long tripsInMonth = allRides.stream()
                    .filter(r -> !r.getStartTimestamp().isBefore(monthStartInstant)
                            && r.getStartTimestamp().isBefore(monthEndInstant))
                    .count();

            monthDataList.add(new MonthData(i + 1, (int) tripsInMonth, requiredTrips));
        }

        return new MonthlyProgress(monthDataList);
    }

    private WeeklyProgress calculateWeeklyProgress(Long riderId, int requiredTrips, int weeks) {
        List<Rides> allRides = ridesRepo.findByUserId(Math.toIntExact(riderId));
        List<WeekData> weekDataList = new ArrayList<>();

        for (int i = 0; i < weeks; i++) {
            Instant weekStart = Instant.now().minus(7L * (i + 1), ChronoUnit.DAYS);
            Instant weekEnd = Instant.now().minus(7L * i, ChronoUnit.DAYS);

            long tripsInWeek = allRides.stream()
                    .filter(r -> r.getStartTimestamp().isAfter(weekStart)
                            && r.getStartTimestamp().isBefore(weekEnd))
                    .count();

            weekDataList.add(new WeekData(i + 1, (int) tripsInWeek, requiredTrips));
        }

        return new WeeklyProgress(weekDataList);
    }

    private String formatMonthlyProgress(MonthlyProgress progress) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < progress.months().size(); i++) {
            MonthData month = progress.months().get(i);
            if (i > 0) sb.append(" | ");
            sb.append(String.format("Month %d: %d/%d trips %s",
                    month.monthNumber(),
                    month.actualTrips(),
                    month.requiredTrips(),
                    month.met() ? "✓" : "✗"
            ));
        }
        return sb.toString();
    }

    private String formatWeeklyProgress(WeeklyProgress progress) {
        long weeksMet = progress.weeks().stream().filter(WeekData::met).count();
        int totalWeeks = progress.weeks().size();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%d/%d weeks completed | ", weeksMet, totalWeeks));

        // Show details for recent 4 weeks
        for (int i = 0; i < Math.min(4, progress.weeks().size()); i++) {
            WeekData week = progress.weeks().get(i);
            if (i > 0) sb.append(" | ");
            sb.append(String.format("Week %d: %d/%d %s",
                    week.weekNumber(),
                    week.actualTrips(),
                    week.requiredTrips(),
                    week.met() ? "✓" : "✗"
            ));
        }
        return sb.toString();
    }

    // Helper records
    private record MonthData(int monthNumber, int actualTrips, int requiredTrips) {
        boolean met() {
            return actualTrips >= requiredTrips;
        }
    }

    private record MonthlyProgress(List<MonthData> months) {
        boolean allMonthsMet() {
            return months.stream().allMatch(MonthData::met);
        }
    }

    private record WeekData(int weekNumber, int actualTrips, int requiredTrips) {
        boolean met() {
            return actualTrips >= requiredTrips;
        }
    }

    private record WeeklyProgress(List<WeekData> weeks) {
        boolean allWeeksMet() {
            return weeks.stream().allMatch(WeekData::met);
        }
    }


    private void updateStatistics(RiderLoyalty loyalty, Long riderId) {
        Instant oneYearAgo = Instant.now().minus(365, ChronoUnit.DAYS);

        // Update trip statistics from Rides table
        List<Rides> allRides = ridesRepo.findByUserId(Math.toIntExact(riderId));
        List<Rides> ridesLastYear = allRides.stream()
                .filter(r -> r.getStartTimestamp().isAfter(oneYearAgo))
                .toList();

        loyalty.setTotalTrips(allRides.size());
        loyalty.setTripsLastYear(ridesLastYear.size());
        
        // BR-002: Assume all completed rides are successful returns (design decision 1c)
        loyalty.setTotalSuccessfulReturns(allRides.size());

        // Update reservation statistics from ReservationHistory table
        // BR-001: Count expired reservations in the last year
        long missedReservations = reservationHistoryRepo.countExpiredReservationsLastYear(riderId, oneYearAgo);
        loyalty.setMissedReservationsLastYear((int) missedReservations);

        // SL-002: Count claimed reservations in the last year
        long claimedReservations = reservationHistoryRepo.countClaimedReservationsLastYear(riderId, oneYearAgo);
        loyalty.setSuccessfulClaimedReservationsLastYear((int) claimedReservations);
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

        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < months; i++) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1);

            Instant monthStartInstant = monthStart.atZone(ZoneId.systemDefault()).toInstant();
            Instant monthEndInstant = monthEnd.atZone(ZoneId.systemDefault()).toInstant();

            long tripsInMonth = allRides.stream()
                    .filter(r -> !r.getStartTimestamp().isBefore(monthStartInstant)
                            && r.getStartTimestamp().isBefore(monthEndInstant))
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
