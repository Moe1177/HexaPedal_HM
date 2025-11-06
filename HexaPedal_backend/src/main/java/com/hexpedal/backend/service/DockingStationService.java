package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CreateStationRequestDTO;
import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.model.DockingStationStates;
import com.hexpedal.backend.repository.DockingStationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DockingStationService {
    private final DockingStationRepository stationRepo;

    public DockingStation changeState(long stationId, DockingStationStates state) {
        DockingStation s = stationRepo.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));
        if (state == DockingStationStates.out_of_service && s.getNumberOfBikesDocked() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot set station out_of_service while bikes are docked. Move bikes first."
            );
        }

        s.setStatus(state);
        return stationRepo.save(s);
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
        return stationRepo.save(s);
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

    public void deleteStation(long stationId) {
        DockingStation s = stationRepo.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));
        boolean hasBike = s.getDocks() != null && s.getDocks().stream().anyMatch(d -> d.getBike() != null);
        if (hasBike) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete station with bikes docked.");
        }
        stationRepo.delete(s);
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
        return stationRepo.save(station);
    }

    public DockingStation getStation(long stationId) {
        return stationRepo.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));
    }

}
