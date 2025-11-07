package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CreateStationRequestDTO;
import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.model.DockingStationStates;
import com.hexpedal.backend.repository.DockingStationRepository;
import com.hexpedal.backend.service.events.DockingStationEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DockingStationService {
    private final DockingStationRepository stationRepo;
    private final DockingStationEventService eventService;
    private final SimpMessagingTemplate messagingTemplate;

    public DockingStation changeState(long stationId, DockingStationStates state) {
        DockingStation s = stationRepo.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));

        DockingStationStates oldState = s.getStatus();

        if (state == DockingStationStates.out_of_service && s.getNumberOfBikesDocked() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot set station out_of_service while bikes are docked. Move bikes first."
            );
        }

        s.setStatus(state);
        DockingStation savedStation = stationRepo.save(s);

        String eventDescription = String.format("Station %d state changed from %s to %s",
                stationId, oldState, state);
        eventService.createEvent(eventDescription);
        broadcastEvent(eventDescription);

        return savedStation;
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

        double oldLat = s.getLatitude();
        double oldLng = s.getLongitude();

        s.setLatitude(latitude);
        s.setLongitude(longitude);
        DockingStation savedStation = stationRepo.save(s);

        String eventDescription = String.format("Station %d position changed from (%f, %f) to (%f, %f)",
                stationId, oldLat, oldLng, latitude, longitude);
        eventService.createEvent(eventDescription);
        broadcastEvent(eventDescription);

        return savedStation;
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

        String stationInfo = String.format("Station %d (%s) at (%f, %f)",
                stationId, s.getName(), s.getLatitude(), s.getLongitude());

        stationRepo.delete(s);

        String eventDescription = "Station deleted: " + stationInfo;
        eventService.createEvent(eventDescription);
        broadcastEvent(eventDescription);
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
        DockingStation savedStation = stationRepo.save(station);

        String eventDescription = String.format("New station created: %s at (%f, %f) with capacity %d",
                req.name(), req.latitude(), req.longitude(), req.bikeCapacity());
        eventService.createEvent(eventDescription);
        broadcastEvent(eventDescription);

        return savedStation;
    }

    public DockingStation getStation(long stationId) {
        return stationRepo.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));
    }

    /**
     * Broadcast events via WebSocket
     */
    public void broadcastEvent(String eventDescription) {
        messagingTemplate.convertAndSend("/bms/events", eventDescription);
    }
}