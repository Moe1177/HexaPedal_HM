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
    List<Dock> findByStation_Id(Long stationId);
    long countByStation_Id(Long stationId);
    long countByStation_IdAndBikeIsNull(Long stationId);
    long countByStation_IdAndBikeIsNotNull(Long stationId);
    Optional<Dock> findFirstByStation_IdAndBikeIsNullOrderByIdAsc(Long stationId);
    Optional<Dock> findByBike(Bike bike);
    Optional<Dock> findByBike_Id(Integer bikeId);
}
