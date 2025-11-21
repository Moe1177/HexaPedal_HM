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


    public void update(MapEntity state) {
        messagingTemplate.convertAndSend("/bms/live-updates", state);
        // TODO: Remove Debug log
        System.out.println("Updated the map with this updated state: " + state);
    }

    public List<MapEntity> getMapEntities(){
        List<DockingStation> freshStations = dockingStationService.cacheDockingStations();
        List<MapEntity> mapEntities = castIntoEntities(freshStations);
        Map.getInstance().setMapEntities(mapEntities);
        initListener();
        return mapEntities;
    }


    private List<MapEntity> castIntoEntities(List<DockingStation> stationMarkers) {
        return new ArrayList<>(stationMarkers);
    }


    private void initListener() {
        for (MapEntity publisher: Map.getInstance().getMapEntities()){
            publisher.addListener(this);
        }
    }


    private void initMapEntities() {
        List<MapEntity> mapEntities = castIntoEntities(dockingStationService.cacheDockingStations());
        Map.getInstance().setMapEntities(mapEntities);
    }


    public void addStationToMap(DockingStation station) {
        Map.getInstance().getMapEntities().add(station);
        station.addListener(this);
        System.out.println("Added station to map: " + station.getName() + " (ID: " + station.getId() + ")");
        

        messagingTemplate.convertAndSend("/bms/live-updates", station);
        System.out.println("Broadcasted new station via WebSocket: " + station.getName());
    }


    public void removeStationFromMap(long stationId) {
        List<MapEntity> entities = Map.getInstance().getMapEntities();
        boolean removed = entities.removeIf(entity -> 
            entity instanceof DockingStation && ((DockingStation) entity).getId().equals(stationId)
        );
        if (removed) {
            System.out.println("Removed station from map with ID: " + stationId);
            java.util.Map<String, Object> deleteNotification = new java.util.HashMap<>();
            deleteNotification.put("event", "station-deleted");
            deleteNotification.put("stationId", stationId);
            messagingTemplate.convertAndSend("/bms/live-updates", deleteNotification);
            System.out.println("Broadcasted station deletion via WebSocket: ID " + stationId);
        }
    }
}
