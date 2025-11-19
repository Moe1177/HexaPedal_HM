package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.Rider;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiderRepository extends JpaRepository<Rider, Long> {
}
