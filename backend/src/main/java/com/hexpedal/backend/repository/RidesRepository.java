package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.Rides;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RidesRepository extends JpaRepository<Rides, Integer> {
    List<Rides> findByUserId(Integer userId);
}
