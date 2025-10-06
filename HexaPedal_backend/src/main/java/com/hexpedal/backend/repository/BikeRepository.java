package com.hexpedal.backend.repository;

import org.springframework.data.repository.CrudRepository;

import com.hexpedal.backend.model.Bike;

public interface BikeRepository extends CrudRepository<Bike, Integer> {

    
}
