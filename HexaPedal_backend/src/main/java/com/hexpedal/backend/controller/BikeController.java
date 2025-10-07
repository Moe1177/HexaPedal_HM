package com.hexpedal.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.repository.BikeRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bikes")
public class BikeController {
    private final BikeRepository bikeRepo;

    public BikeController(BikeRepository bikeRepo) {
        this.bikeRepo = bikeRepo;
    }
    @PostMapping
    public ResponseEntity<Bike> createBike(@RequestBody Bike bike) {
        // make sure new bikes start as available
        bike.setBikeStatus(BikeStatus.available);
        Bike saved = bikeRepo.save(bike);
        return ResponseEntity.status(201).body(saved);
    }

    @GetMapping
    public ResponseEntity<?> getAllBikes() {
        return ResponseEntity.ok(bikeRepo.findAll());
    }
    
}
