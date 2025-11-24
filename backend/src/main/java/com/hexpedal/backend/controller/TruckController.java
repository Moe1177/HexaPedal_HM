package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.CreateTruckRequestDTO;
import com.hexpedal.backend.model.Truck;
import com.hexpedal.backend.service.TruckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trucks")
@RequiredArgsConstructor
public class TruckController {

    private final TruckService truckService;

    @GetMapping
    public List<Truck> getAllTrucks() {
        return truckService.getAllTrucks();
    }

    @PostMapping
    public ResponseEntity<Truck> createTruck(@RequestBody CreateTruckRequestDTO request) {
        Truck created = truckService.createTruck(request);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/{truckId}/load/{bikeId}")
    public ResponseEntity<Truck> loadBikeOntoTruck(
            @PathVariable Long truckId,
            @PathVariable Integer bikeId
    ) {
        Truck updated = truckService.loadBikeOntoTruck(truckId, bikeId);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{truckId}/unload/{bikeId}/station/{stationId}")
    public ResponseEntity<Truck> unloadBikeFromTruckToStation(
            @PathVariable Long truckId,
            @PathVariable Integer bikeId,
            @PathVariable Long stationId
    ) {
        Truck updated = truckService.unloadBikeFromTruckToStation(truckId, bikeId, stationId);
        return ResponseEntity.ok(updated);
    }
}
