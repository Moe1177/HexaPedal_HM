package com.hexpedal.backend.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.repository.DockingStationRepository;


@RestController
@RequestMapping("/api/stations")
public class DockingStationController {
     private final DockingStationRepository stationRepo;

    public DockingStationController(DockingStationRepository stationRepo) {
        this.stationRepo = stationRepo;
    }
    @PostMapping
    public ResponseEntity<DockingStation> createStation(@RequestBody DockingStation station) {
        DockingStation saved = stationRepo.save(station);
        return ResponseEntity.status(201).body(saved);
    }
    @GetMapping
    public ResponseEntity<?> getAllStations() {
        return ResponseEntity.ok(stationRepo.findAll());
    }
}
