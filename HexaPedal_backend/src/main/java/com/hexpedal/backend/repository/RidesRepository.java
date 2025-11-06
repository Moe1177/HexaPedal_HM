package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.RideStatus;
import com.hexpedal.backend.model.Rides;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RidesRepository extends JpaRepository<Rides, Integer> {
    List<Rides> findByUserId(Integer userId);
    List<Rides> findByUserIdOrderByStartTimeDesc(Long userId);
    Optional<Rides> findByUserIdAndStatus(Long userId, RideStatus status);
    List<Rides> findByBikeIdOrderByStartTimeDesc(Integer bikeId);
    List<Rides> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
