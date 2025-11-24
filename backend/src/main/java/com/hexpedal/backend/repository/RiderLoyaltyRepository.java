package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.User;
import com.hexpedal.backend.model.RiderLoyalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RiderLoyaltyRepository extends JpaRepository<RiderLoyalty, Long> {
    Optional<RiderLoyalty> findByUser(User user);
    Optional<RiderLoyalty> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
