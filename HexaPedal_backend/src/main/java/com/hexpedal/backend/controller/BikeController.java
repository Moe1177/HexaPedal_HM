package com.hexpedal.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.repository.BikeRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import com.hexpedal.backend.service.BikeService;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bikes")
public class BikeController {
    private final BikeRepository bikeRepo;
    private final BikeService bikeService;

    public BikeController(BikeRepository bikeRepo , BikeService bikeService) {
        this.bikeRepo = bikeRepo;
        this.bikeService = bikeService;
    }
    @PostMapping
    public ResponseEntity<Bike> createBike(@RequestBody Bike bike) {
        bike.setBikeStatus(BikeStatus.available);
        Bike saved = bikeRepo.save(bike);
        return ResponseEntity.status(201).body(saved);
    }


    @GetMapping
    public ResponseEntity<?> getAllBikes() {
        return ResponseEntity.ok(bikeRepo.findAll());
    }
     @PutMapping("/{bikeId}/status")
    public ResponseEntity<Bike> updateBikeStatus(
            @PathVariable Integer bikeId,
            @RequestParam BikeStatus status
    ) {
        Bike updated = bikeService.updateStatus(bikeId, status);
        return ResponseEntity.ok(updated);
    }
    
}
