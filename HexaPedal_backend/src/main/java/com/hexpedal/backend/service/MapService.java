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
     * Broadcast updated state to clients subscribed to /bms/station-updates endpoint.
     * @param state is the updated state of a given Publisher entity
     */
    public void update(MapEntity state) {
        messagingTemplate.convertAndSend("/bms/station-updates", state);
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
}
