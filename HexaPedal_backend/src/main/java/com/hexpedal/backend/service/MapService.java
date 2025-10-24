package com.hexpedal.backend.service;

import com.hexpedal.backend.model.Map;
import com.hexpedal.backend.model.StationMarker;
import com.hexpedal.backend.repository.StationMarkerRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.util.List;

@Service
public class MapService {

    private final StationMarkerRepository stationMarkerRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MapService(StationMarkerRepository stationMarkerRepository, SimpMessagingTemplate messagingTemplate) {
        this.stationMarkerRepository = stationMarkerRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
    public void initMap() {
        List<StationMarker> markers = stationMarkerRepository.findAll();
        Map.getInstance().setStationMarkers(markers);
    }

    public String loadMapConfig() {
        try {
            URL resource = getClass().getClassLoader().getResource("mapConfig.json");
            System.out.println("Resource URL: " + resource);
            if (resource == null) {
                throw new IOException("mapConfig.json not found in resources");
            }
            Path resourcePath = Paths.get(resource.toURI());
            String content = Files.readString(resourcePath);
            return content;
        } catch (Exception e) {
            throw new RuntimeException("Failed to load mapConfig.json", e);
        }
    }

    /**
     * Update station in cache and broadcast to all connected clients
     * @param updatedMarker
     */
    public void updateMap(StationMarker updatedMarker) {
        Map.getInstance().updateStationMarker(updatedMarker);

        // Broadcast to all WebSocket clients
        messagingTemplate.convertAndSend("/bms/station-updates", updatedMarker);

        System.out.println("Station updated and broadcasted: " + updatedMarker.getId());
    }
}
