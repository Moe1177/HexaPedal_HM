package com.hexpedal.backend.model;

import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

public class Map {
    @Setter
    private List<StationMarker> stationMarkers;
    private static Map instance;

    private Map() {
        this.stationMarkers = new ArrayList<>();
    }

    public static Map getInstance() {
        if (instance == null) {
            instance = new Map();
        }
        return instance;
    }

    public void updateStationMarker(StationMarker updatedMarker) {
        if (stationMarkers == null || stationMarkers.isEmpty()) return;

        for (int i = 0; i < stationMarkers.size(); i++) {
            StationMarker current = stationMarkers.get(i);
            if (current.getId().equals(updatedMarker.getId())) {
                stationMarkers.set(i, updatedMarker);
                System.out.println("Station marker updated in cache: " + updatedMarker.getId());
                return;
            }
        }

        // If the marker doesn't exist yet (new station added)
        stationMarkers.add(updatedMarker);
        System.out.println("New station marker added to cache: " + updatedMarker.getId());
    }
}
