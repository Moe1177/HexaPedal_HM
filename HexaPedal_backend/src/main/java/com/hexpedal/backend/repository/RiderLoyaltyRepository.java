package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.Rider;
import com.hexpedal.backend.model.RiderLoyalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RiderLoyaltyRepository extends JpaRepository<RiderLoyalty, Long> {
    Optional<RiderLoyalty> findByRider(Rider rider);
    Optional<RiderLoyalty> findByRiderId(Long riderId);
    boolean existsByRiderId(Long riderId);
}
