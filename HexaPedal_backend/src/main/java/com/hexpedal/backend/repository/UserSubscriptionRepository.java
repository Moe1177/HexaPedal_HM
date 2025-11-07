package com.hexpedal.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hexpedal.backend.model.UserSubscription;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    Optional<UserSubscription> findByUserIdAndStatus(Long userId, String status);
    Optional<UserSubscription> findByStripeSubscriptionId(String stripeSubscriptionId);
    List<UserSubscription> findByUserId(Long userId);
    Optional<UserSubscription> findByUserIdAndStatusIn(Long userId, List<String> statuses);
}

