package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CreateStationRequestDTO;
import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.model.DockingStationStates;
import com.hexpedal.backend.model.Map;
import com.hexpedal.backend.model.MapEntity;
import com.hexpedal.backend.repository.DockingStationRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DockingStationService {
    private final DockingStationRepository stationRepo;
    private final MapService mapService;

    public DockingStationService(DockingStationRepository stationRepo, @Lazy MapService mapService) {
        this.stationRepo = stationRepo;
        this.mapService = mapService;
    }
    
    /**
     * Find the cached station instance and update it with fresh data, then trigger WebSocket notification
     */
    private void updateAndNotifyCachedStation(Long stationId) {
        // Get fresh data from database
        DockingStation freshStation = stationRepo.findById(stationId).orElse(null);
        if (freshStation == null) {
            System.out.println("[WebSocket] Station " + stationId + " not found in database");
            return;
        }
        
        System.out.println("[WebSocket] Updating cached station " + stationId + " with status: " + freshStation.getStatus());
        
        // Find and update the cached instance
        for (MapEntity entity : Map.getInstance().getMapEntities()) {
            if (entity instanceof DockingStation) {
                DockingStation cachedStation = (DockingStation) entity;
                if (cachedStation.getId().equals(stationId)) {
                    System.out.println("[WebSocket] Found cached station, updating from " + cachedStation.getStatus() + " to " + freshStation.getStatus());
                    // Update cached station with fresh data before notifying
                    // This ensures WebSocket sends current data
                    cachedStation.setStatus(freshStation.getStatus());
                    cachedStation.setLatitude(freshStation.getLatitude());
                    cachedStation.setLongitude(freshStation.getLongitude());
                    cachedStation.setName(freshStation.getName());
                    cachedStation.setAddress(freshStation.getAddress());
                    // Note: setters call notifyListeners() automatically
                    System.out.println("[WebSocket] Station " + stationId + " update triggered");
                    break;
                }
            }
        }
    }

    public DockingStation changeState(long stationId, DockingStationStates state) {
        DockingStation s = stationRepo.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));
        
        // Allow setting to out_of_service regardless of bikes
        // Operators can manage stations as needed
        s.setStatus(state);
        DockingStation saved = stationRepo.save(s);
        
        // Update cached instance and trigger WebSocket notification
        updateAndNotifyCachedStation(stationId);
        
        return saved;
    }

    public DockingStation changePosition(long stationId, double latitude, double longitude) {
        if (stationRepo.existsByLatitudeAndLongitude(latitude, longitude)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A station already exists at these coordinates.");
        }

        DockingStation s = stationRepo.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));
        if (s.getNumberOfBikesDocked() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot change position while bikes are docked. Move bikes first."
            );
        }
        s.setLatitude(latitude);
        s.setLongitude(longitude);
        DockingStation saved = stationRepo.save(s);
        
        // Update cached instance and trigger WebSocket notification
        updateAndNotifyCachedStation(stationId);
        
        return saved;
    }

    /**
     * Get all stations
     */
    public List<DockingStation> getAllStations() {
        return stationRepo.findAll();
    }

    /**
     * Cache all stations in memory during application startup
     * Use this for @PostConstruct initialization in MapService
     * Returns fully loaded entities for in-memory storage
     */
    @Transactional(readOnly = true)
    public List<DockingStation> cacheDockingStations() {
        List<DockingStation> stations = stationRepo.findAll();
        stations.forEach(station -> {
            if (station.getDocks() != null) {
                station.getDocks().size(); // Force load docks
            }
        });
        return stations;
    }

    @Transactional
    public void deleteStation(long stationId) {
        DockingStation s = stationRepo.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));
        
        // Force load docks collection to avoid lazy loading issues
        if (s.getDocks() != null) {
            s.getDocks().size();
        }
        
        boolean hasBike = s.getDocks() != null && s.getDocks().stream().anyMatch(d -> d.getBike() != null);
        if (hasBike) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete station with bikes docked.");
        }
        stationRepo.delete(s);
        // Remove from map cache
        mapService.removeStationFromMap(stationId);
    }

    public DockingStation create(CreateStationRequestDTO req) {
        if (stationRepo.existsByLatitudeAndLongitude(req.latitude(), req.longitude())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A station already exists at these coordinates.");
        }
        DockingStation station = new DockingStation(
                req.name(),
                req.latitude(),
                req.longitude(),
                req.address(),
                req.bikeCapacity()
        );
        DockingStation saved = stationRepo.save(station);
        // Add to map cache
        mapService.addStationToMap(saved);
        return saved;
    }

    public DockingStation getStation(long stationId) {
        return stationRepo.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));
    }

}
