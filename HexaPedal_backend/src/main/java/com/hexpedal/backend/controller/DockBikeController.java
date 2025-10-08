package com.hexpedal.backend.controller;

import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.Dock;
import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.repository.BikeRepository;
import com.hexpedal.backend.repository.DockRepository;
import com.hexpedal.backend.repository.DockingStationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/docks")
public class DockBikeController {

    private final DockRepository dockRepo;
    private final BikeRepository bikeRepo;
    private final DockingStationRepository stationRepo;

    public DockBikeController(DockRepository dockRepo, BikeRepository bikeRepo, DockingStationRepository stationRepo) {
        this.dockRepo = dockRepo;
        this.bikeRepo = bikeRepo;
        this.stationRepo = stationRepo;
    }
    @PostMapping("/{stationId}/{dockId}/bike/{bikeId}")
    public ResponseEntity<?> dockBike(
            @PathVariable Long stationId,
            @PathVariable Integer dockId,
            @PathVariable Integer bikeId) {

        DockingStation station = stationRepo.findById(stationId).orElseThrow(() -> new EntityNotFoundException("Station not found: " + stationId));

        Dock dock = dockRepo.findById((long) dockId).orElseThrow(() -> new EntityNotFoundException("Dock not found: " + dockId));

        if (!station.getDocks().contains(dock)) {
            throw new IllegalStateException("This dock does not belong to the specified station.");
        }

        if (!dock.isEmpty()) {
            throw new IllegalStateException("This dock is already occupied.");
        }

        Bike bike = bikeRepo.findById(bikeId).orElseThrow(() -> new EntityNotFoundException("Bike not found: " + bikeId));

        dock.setBike(bike);
        dockRepo.save(dock);

        bike.setBikeStatus(com.hexpedal.backend.model.BikeStatus.available);
        bikeRepo.save(bike);

        return ResponseEntity.noContent().build();
    }
}
