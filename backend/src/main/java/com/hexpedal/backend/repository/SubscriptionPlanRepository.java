package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.PlanType;
import com.hexpedal.backend.model.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    Optional<SubscriptionPlan> findByPlanType(PlanType planType);
    List<SubscriptionPlan> findByActiveTrue();
}

