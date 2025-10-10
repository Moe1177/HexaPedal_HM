package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.CreateStationRequestDTO;
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
    public ResponseEntity<DockingStation> create(@RequestBody CreateStationRequestDTO req) {
        DockingStation station = new DockingStation(
            req.name(),
            req.latitude(),
            req.longitude(),
            req.address(),
            req.bikeCapacity()
        );

        DockingStation saved = stationRepo.save(station);
        return ResponseEntity.status(201).body(saved);
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(stationRepo.findAll());
    }
}
