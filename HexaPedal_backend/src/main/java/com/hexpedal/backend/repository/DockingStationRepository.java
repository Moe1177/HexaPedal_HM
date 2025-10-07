package com.hexpedal.backend.repository;

import org.springframework.data.repository.CrudRepository;

import com.hexpedal.backend.model.DockingStation;

import com.hexpedal.backend.model.PositionStates;
import java.util.List;
import java.util.Optional;
public interface DockingStationRepository extends CrudRepository<DockingStation, Long> {

      List<DockingStation> findAll();


      Optional<DockingStation> findById(Long id);
  

      Optional<DockingStation> findByName(String name);
  

      List<DockingStation> findByPosition(PositionStates position);
  

      Optional<DockingStation> findByNameAndPosition(String name, PositionStates position);
    
}
