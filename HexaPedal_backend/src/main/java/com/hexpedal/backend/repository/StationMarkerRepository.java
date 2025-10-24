package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.StationMarker;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface StationMarkerRepository extends CrudRepository<StationMarker, Long> {
    List<StationMarker> findAll();
}
