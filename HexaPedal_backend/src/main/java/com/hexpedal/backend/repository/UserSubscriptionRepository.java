package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.SubscriptionStatus;
import com.hexpedal.backend.model.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    
    @Query("SELECT us FROM UserSubscription us WHERE us.user.id = :userId AND us.status = 'ACTIVE' ORDER BY us.currentPeriodEnd DESC")
    Optional<UserSubscription> findActiveSubscriptionByUserId(@Param("userId") Long userId);
    
    Optional<UserSubscription> findByStripeSubscriptionId(String stripeSubscriptionId);
    
    @Query("SELECT COUNT(us) > 0 FROM UserSubscription us WHERE us.user.id = :userId AND us.status = 'ACTIVE'")
    boolean hasActiveSubscription(@Param("userId") Long userId);
}

