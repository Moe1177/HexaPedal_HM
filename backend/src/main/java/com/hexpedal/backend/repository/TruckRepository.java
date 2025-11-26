package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.Truck;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TruckRepository extends CrudRepository<Truck, Long> {
    List<Truck> findAll();
}
