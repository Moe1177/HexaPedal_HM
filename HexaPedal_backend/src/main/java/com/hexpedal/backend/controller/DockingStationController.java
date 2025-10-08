// src/main/java/com/hexpedal/backend/controller/DockingStationController.java
package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.CreateStationRequest;
import com.hexpedal.backend.model.Dock;
import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.repository.DockingStationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stations")
public class DockingStationController {

  private final DockingStationRepository stationRepo;

  public DockingStationController(DockingStationRepository stationRepo) {
    this.stationRepo = stationRepo;
  }

  @PostMapping(consumes = "application/json", produces = "application/json")
  public ResponseEntity<DockingStation> create(@RequestBody CreateStationRequest req) {
    DockingStation station = new DockingStation(
        req.name(),
        req.position(), 
        req.address(),
        req.bikeCapacity()
    );
    for (Dock d : station.getDocks()) {
      try {
      } catch (NoSuchMethodError ignored) {}
    }

    DockingStation saved = stationRepo.save(station);
    return ResponseEntity.status(201).body(saved);
  }

  @GetMapping
  public ResponseEntity<?> list() {
    return ResponseEntity.ok(stationRepo.findAll());
  }
}
