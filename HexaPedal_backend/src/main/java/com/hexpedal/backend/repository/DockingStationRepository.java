package com.hexpedal.backend.repository;

import org.springframework.data.repository.CrudRepository;

import com.hexpedal.backend.model.DockingStation;
public interface DockingStationRepository extends CrudRepository<DockingStation, Long> 
 {
    
}
