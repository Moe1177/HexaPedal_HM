package com.hexpedal.backend.repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.Dock;
import com.hexpedal.backend.model.DockingStation;
import java.util.List;
import java.util.Optional;

public interface DockRepository extends CrudRepository<Dock,Long> {
    List<Dock> findByStation(DockingStation station);
    List<Dock> findByStationId(Long stationId);
    long countByStationId(Long stationId);
    long countByStationIdAndBikeIsNull(Long stationId);       
    long countByStationIdAndBikeIsNotNull(Long stationId);    
    Optional<Dock> findFirstByStationIdAndBikeIsNullOrderByIdAsc(Long stationId);
    Optional<Dock> findByBike(Bike bike);
    Optional<Dock> findByBikeId(Integer bikeId);
}
