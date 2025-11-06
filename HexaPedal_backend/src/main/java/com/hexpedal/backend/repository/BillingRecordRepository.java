package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingRecordRepository extends JpaRepository<BillingRecord, Long> {
    List<BillingRecord> findByUserIdOrderByBillingDateDesc(Long userId);
    List<BillingRecord> findByUserIdAndStatus(Long userId, BillingStatus status);
    List<BillingRecord> findByBillingDateBetween(LocalDateTime start, LocalDateTime end);
    Optional<BillingRecord> findByTripId(Long tripId);
}
