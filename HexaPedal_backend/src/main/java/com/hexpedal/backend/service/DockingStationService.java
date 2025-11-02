package com.hexpedal.backend.service;

import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.repository.DockingStationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DockingStationService {

    private final DockingStationRepository dockingStationRepository;

    public DockingStationService(DockingStationRepository dockingStationRepository) {
        this.dockingStationRepository = dockingStationRepository;
    }

    /**
     * Get station by ID
     * @param stationId
     */
    public DockingStation getStationById(Long stationId) {
        return dockingStationRepository.findById(stationId).orElse(null);
    }

    /**
     * Get the station where a specific bike is currently located
     */
    public DockingStation getStationForBike(Integer bikeId) {
        // TODO: Implement your logic to find which station this bike is at
        // This might involve:
        // 1. Query bike repository to get bike details
        // 2. Get the bike's current station ID
        // 3. Return the station marker

        // Example placeholder:
        // Bike bike = bikeRepository.findById(bikeId).orElseThrow(...);
        // return stationMarkerRepository.findById(bike.getCurrentStationId()).orElseThrow(...);

        throw new UnsupportedOperationException("Implement bike-to-station lookup logic");
    }

    /**
     * Get all stations
     */
    public List<DockingStation> getAllStations() {
        return dockingStationRepository.findAll();
    }

    /**
     * Cache all stations in memory during application startup
     * Use this for @PostConstruct initialization in MapService
     * Returns fully loaded entities for in-memory storage
     */
    @Transactional(readOnly = true)
    public List<DockingStation> cacheDockingStations() {
        List<DockingStation> stations = dockingStationRepository.findAll();
        stations.forEach(station -> {
            if (station.getDocks() != null) {
                station.getDocks().size(); // Force load docks
            }
        });
        return stations;
    }
}