package com.hexpedal.backend.service;

import com.hexpedal.backend.model.StationMarker;
import com.hexpedal.backend.repository.StationMarkerRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class StationMarkerService {

    private final StationMarkerRepository stationMarkerRepository;

    public StationMarkerService(StationMarkerRepository stationMarkerRepository) {
        this.stationMarkerRepository = stationMarkerRepository;
    }

    /**
     * Get station by ID
     * @param stationId
     * @return
     */
    public StationMarker getStationById(Long stationId) {
        return stationMarkerRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Station not found: " + stationId));
    }

    /**
     * Get the station where a specific bike is currently located
     * @param bikeId
     * @return
     */
    public StationMarker getStationForBike(Integer bikeId) {
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
     * @return
     */
    public Iterable<StationMarker> getAllStations() {
        return stationMarkerRepository.findAll();
    }

    /**
     * Save or update a station marker
     * @param station
     * @return
     */
    public StationMarker saveStation(StationMarker station) {
        return stationMarkerRepository.save(station);
    }
}