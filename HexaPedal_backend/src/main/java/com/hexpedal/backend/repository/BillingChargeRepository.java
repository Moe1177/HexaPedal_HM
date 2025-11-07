package com.hexpedal.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexpedal.backend.model.BillingCharge;

public interface BillingChargeRepository extends JpaRepository<BillingCharge, Long> {
    List<BillingCharge> findByUserIdOrderByStartTimestampDesc(Long userId);
    List<BillingCharge> findByUserIdAndChargeStatus(Long userId, String chargeStatus);
    Optional<BillingCharge> findByStripeChargeId(String stripeChargeId);
}

