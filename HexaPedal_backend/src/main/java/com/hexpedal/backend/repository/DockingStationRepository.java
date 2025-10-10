package com.hexpedal.backend.repository;

import org.springframework.data.repository.CrudRepository;
import com.hexpedal.backend.model.DockingStation;
import java.util.List;
import java.util.Optional;

public interface DockingStationRepository extends CrudRepository<DockingStation, Long> {

    List<DockingStation> findAll();
    Optional<DockingStation> findById(Long id);
    Optional<DockingStation> findByName(String name);
    List<DockingStation> findByLatitudeAndLongitude(double latitude, double longitude);
    Optional<DockingStation> findByNameAndLatitudeAndLongitude(String name, double latitude, double longitude);
}
