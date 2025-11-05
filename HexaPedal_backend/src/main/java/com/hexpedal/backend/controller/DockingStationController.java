package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.UpdateStationStateDTO;
import com.hexpedal.backend.dto.CreateStationRequestDTO;
import com.hexpedal.backend.dto.UpdateStationPositionDTO;
import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.repository.DockingStationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.hexpedal.backend.service.DockingStationService;

@RestController
@RequestMapping("/api/stations")
public class DockingStationController {
    private final DockingStationRepository stationRepo;
    private final DockingStationService dockingStationService;

    public DockingStationController(DockingStationRepository stationRepo, DockingStationService dockingStationService) {
        this.stationRepo = stationRepo;
        this.dockingStationService = dockingStationService;
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

        DockingStation saved = dockingStationService.create(req);
        return ResponseEntity.status(201).body(saved);
    }

    @PatchMapping("/{stationId}/state")
    public ResponseEntity<DockingStation> updateState(
            @PathVariable long stationId,
            @RequestBody UpdateStationStateDTO body) {
        DockingStation updated = dockingStationService.changeState(stationId, body.getState());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{stationId}/position")
    public ResponseEntity<DockingStation> updatePosition(
            @PathVariable long stationId,
            @RequestBody UpdateStationPositionDTO body) {
        DockingStation updated = dockingStationService.changePosition(stationId, body.getLatitude(), body.getLongitude());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{stationId}")
    public ResponseEntity<Void> deleteStation(@PathVariable long stationId) {
        dockingStationService.deleteStation(stationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(stationRepo.findAll());
    }

}
