package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.ReservationHistory;
import com.hexpedal.backend.model.ReservationOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationHistoryRepository extends JpaRepository<ReservationHistory, Long> {
    
    /**
     * Find all reservation history records for a specific rider
     */
    List<ReservationHistory> findByRiderId(Long riderId);
    
    /**
     * Find all reservation history records for a rider within a date range
     */
    @Query("SELECT rh FROM ReservationHistory rh WHERE rh.rider.id = :riderId " +
           "AND rh.reservationCreatedAt >= :startDate AND rh.reservationCreatedAt < :endDate")
    List<ReservationHistory> findByRiderIdAndDateRange(
            @Param("riderId") Long riderId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );
    
    /**
     * Count reservations with a specific outcome for a rider within a date range
     */
    @Query("SELECT COUNT(rh) FROM ReservationHistory rh WHERE rh.rider.id = :riderId " +
           "AND rh.outcome = :outcome " +
           "AND rh.reservationCreatedAt >= :startDate")
    long countByRiderIdAndOutcomeAfterDate(
            @Param("riderId") Long riderId,
            @Param("outcome") ReservationOutcome outcome,
            @Param("startDate") Instant startDate
    );
    
    /**
     * Count expired reservations in the last year for a rider
     */
    default long countExpiredReservationsLastYear(Long riderId, Instant oneYearAgo) {
        return countByRiderIdAndOutcomeAfterDate(riderId, ReservationOutcome.EXPIRED, oneYearAgo);
    }
    
    /**
     * Count claimed reservations in the last year for a rider
     */
    default long countClaimedReservationsLastYear(Long riderId, Instant oneYearAgo) {
        return countByRiderIdAndOutcomeAfterDate(riderId, ReservationOutcome.CLAIMED, oneYearAgo);
    }
    
    /**
     * Find the most recent pending reservation for a rider and bike
     */
    @Query("SELECT rh FROM ReservationHistory rh WHERE rh.rider.id = :riderId " +
           "AND rh.bike.id = :bikeId AND rh.outcome = :outcome " +
           "ORDER BY rh.reservationCreatedAt DESC")
    List<ReservationHistory> findByRiderIdAndBikeIdAndOutcome(
            @Param("riderId") Long riderId,
            @Param("bikeId") Integer bikeId,
            @Param("outcome") ReservationOutcome outcome
    );
    
    /**
     * Find the most recent pending reservation for a rider and bike (single result)
     */
    default Optional<ReservationHistory> findMostRecentPendingReservation(Long riderId, Integer bikeId) {
        List<ReservationHistory> results = findByRiderIdAndBikeIdAndOutcome(
                riderId, bikeId, ReservationOutcome.PENDING
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }
}

