package com.hexpedal.backend.service;

import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.model.Map;
import com.hexpedal.backend.model.MapEntityListener;
import com.hexpedal.backend.model.MapEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class MapService implements MapEntityListener {
    private final SimpMessagingTemplate messagingTemplate;
    private final DockingStationService dockingStationService;

    public MapService(SimpMessagingTemplate messagingTemplate, DockingStationService dockingStationService) {
        this.messagingTemplate = messagingTemplate;
        this.dockingStationService = dockingStationService;
        initMapEntities();
        initListener();
    }

    /**
     * Broadcast updated state to clients subscribed to /bms/live-updates endpoint.
     * @param state is the updated state of a given Publisher entity
     */
    public void update(MapEntity state) {
        messagingTemplate.convertAndSend("/bms/live-updates", state);
        // TODO: Remove Debug log
        System.out.println("Updated the map with this updated state: " + state);
    }

    /**
     * List all the entities on top of the map.
     */
    public List<MapEntity> getMapEntities(){
        return Map.getInstance().getMapEntities();
    }

    /**
     * Turn the docking station into usable entities.
     * @param stationMarkers list of docking stations
     */
    private List<MapEntity> castIntoEntities(List<DockingStation> stationMarkers) {
        return new ArrayList<>(stationMarkers);
    }

    /**
     * Attach the listener to the publisher instance
     */
    private void initListener() {
        for (MapEntity publisher: Map.getInstance().getMapEntities()){
            publisher.addListener(this);
        }
    }

    /**
     * Load the map entities into the map instance.
     */
    private void initMapEntities() {
        List<MapEntity> mapEntities = castIntoEntities(dockingStationService.cacheDockingStations());
        Map.getInstance().setMapEntities(mapEntities);
    }

    /**
     * Add a new station entity to the map and attach listener
     * @param station the newly created station to add
     */
    public void addStationToMap(DockingStation station) {
        Map.getInstance().getMapEntities().add(station);
        station.addListener(this);
        System.out.println("Added station to map: " + station.getName() + " (ID: " + station.getId() + ")");
        
        // Broadcast the new station to all connected clients
        messagingTemplate.convertAndSend("/bms/live-updates", station);
        System.out.println("Broadcasted new station via WebSocket: " + station.getName());
    }

    /**
     * Remove a station entity from the map
     * @param stationId the ID of the station to remove
     */
    public void removeStationFromMap(long stationId) {
        List<MapEntity> entities = Map.getInstance().getMapEntities();
        boolean removed = entities.removeIf(entity -> 
            entity instanceof DockingStation && ((DockingStation) entity).getId().equals(stationId)
        );
        if (removed) {
            System.out.println("Removed station from map with ID: " + stationId);
            // Notify clients that they should reload map entities
            // We send a simple message indicating a station was deleted
            java.util.Map<String, Object> deleteNotification = new java.util.HashMap<>();
            deleteNotification.put("event", "station-deleted");
            deleteNotification.put("stationId", stationId);
            messagingTemplate.convertAndSend("/bms/live-updates", deleteNotification);
            System.out.println("Broadcasted station deletion via WebSocket: ID " + stationId);
        }
    }
}
