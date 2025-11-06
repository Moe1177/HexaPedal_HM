package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PricingPlanRepository extends JpaRepository<PricingPlan, Long> {
    Optional<PricingPlan> findByDefaultPlanTrue();
    List<PricingPlan> findByActiveTrue();
    Optional<PricingPlan> findByName(String name);
}
