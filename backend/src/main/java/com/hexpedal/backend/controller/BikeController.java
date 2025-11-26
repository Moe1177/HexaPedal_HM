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
import com.hexpedal.backend.repository.DockRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import com.hexpedal.backend.service.BikeService;
import com.hexpedal.backend.service.TruckService;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bikes")
public class BikeController {
    private final BikeRepository bikeRepo;
    private final BikeService bikeService;
    private final DockRepository dockRepo;
    private final TruckService truckService;

    public BikeController(BikeRepository bikeRepo , BikeService bikeService, DockRepository dockRepo, TruckService truckService) {
        this.bikeRepo = bikeRepo;
        this.bikeService = bikeService;
        this.dockRepo = dockRepo;
        this.truckService = truckService;
    }
    @PostMapping
    public ResponseEntity<Bike> createBike(@RequestBody Bike bike) {
        bike.setBikeStatus(BikeStatus.available);
        Bike saved = bikeRepo.save(bike);
        return ResponseEntity.status(201).body(saved);
    }


    @GetMapping
    public ResponseEntity<?> getAllBikes() {

        truckService.ensureBikesOnTrucksHaveMaintenanceStatus();
        
        List<Bike> bikes = bikeRepo.findAll();
        

        for (Bike bike : bikes) {
            dockRepo.findByBike_Id(bike.getId()).ifPresent(dock -> {
                if (dock.getStation() != null) {
                    bike.setCurrentStationName(dock.getStation().getName());
                    bike.setCurrentStationId(dock.getStation().getId());
                }
            });
        }
        
        return ResponseEntity.ok(bikes);
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
