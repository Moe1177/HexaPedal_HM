package com.hexpedal.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "StationMarkers") // Name of your MongoDB collection
public class StationMarker {

    @Id
    private String id; // MongoDB document ID (usually an ObjectId in the DB)

    @Field("label")
    private String label;

    @Field("stationFullness")
    private StationFullness stationFullness;

    @Field("dockingStation")
    private DockingStation dockingStation;

    // --- Constructors ---

    public StationMarker() {
    }

    public StationMarker(String label, StationFullness stationFullness, DockingStation dockingStation) {
        this.label = label;
        this.stationFullness = stationFullness;
        this.dockingStation = dockingStation;
    }

    // --- Getters and Setters ---

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public StationFullness getStationFullness() {
        return stationFullness;
    }

    public void setStationFullness(StationFullness stationFullness) {
        this.stationFullness = stationFullness;
    }

    public DockingStation getDockingStation() {
        return dockingStation;
    }

    public void setDockingStation(DockingStation dockingStation) {
        this.dockingStation = dockingStation;
    }

    @Override
    public String toString() {
        return "StationMarker{" +
                "id='" + id + '\'' +
                ", label='" + label + '\'' +
                ", stationFullness=" + stationFullness +
                ", dockingStation=" + dockingStation +
                '}';
    }
}
