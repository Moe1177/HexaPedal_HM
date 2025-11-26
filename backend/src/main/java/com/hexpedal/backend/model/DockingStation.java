package com.hexpedal.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "docking_stations")
@Getter
public class DockingStation extends MapEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DockingStationStates status;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private int bikeCapacity;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "station_id")
    @JsonIgnore 
    private List<Dock> docks = new ArrayList<>();

    private LocalTime reservationholdTime;

    public DockingStation() {}

    public DockingStation(String name, double latitude, double longitude, String address, int bikeCapacity) {
        super();
        this.name = name;
        this.status = DockingStationStates.active;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.bikeCapacity = bikeCapacity;
        this.docks = new ArrayList<>();

        for (int i = 0; i < bikeCapacity; i++) {
            this.docks.add(new Dock());
        }
    }

    public void setName(String name) {
        this.name = name;
        notifyListeners(this);
    }

    public void setStatus(DockingStationStates status) {
        this.status = status;
        notifyListeners(this);
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
        notifyListeners(this);
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
        notifyListeners(this);
    }

    public void setAddress(String address) {
        this.address = address;
        notifyListeners(this);
    }

    public void setBikeCapacity(int bikeCapacity) {
        this.bikeCapacity = bikeCapacity;
        notifyListeners(this);
    }

    public void setDocks(List<Dock> docks) {
        this.docks = (docks != null) ? docks : new ArrayList<>();
        notifyListeners(this);
    }

    public void setReservationholdTime(LocalTime reservationholdTime) {
        this.reservationholdTime = reservationholdTime;
        notifyListeners(this);
    }

    @JsonProperty("numberOfBikesDocked")
    public int getNumberOfBikesDocked() {
        int count = 0;
        if (docks != null) {
            for (Dock d : docks) {
                if (d != null && !d.isEmpty()) count++;
            }
        }
        return count;
    }

    public boolean hasEmptyDock() {
        for (Dock d : docks) {
            if (d != null && d.isEmpty()) return true;
        }
        return false;
    }

    public Dock findEmptyDock() {
        for (Dock d : docks) {
            if (d != null && d.isEmpty()) return d;
        }
        return null;
    }

    public void addDock(Dock dock) {
        if (dock == null) return;
        if (docks.size() >= bikeCapacity) {
            throw new IllegalStateException("No dock slot available in station: " + name);
        }
        docks.add(dock);
        notifyListeners(this);
    }

    public void removeDock(Dock dock) {
        if (dock == null) return;
        if (!dock.isEmpty()) {
            throw new IllegalStateException("Cannot remove a dock that holds a bike.");
        }
        docks.remove(dock);
        notifyListeners(this);
    }

    public void placeBikeIntoEmptyDock(Bike bike) {
        Dock empty = findEmptyDock();
        if (empty == null) throw new IllegalStateException("No empty dock available.");
        empty.assignBike(bike);
        notifyListeners(this);
    }

    public Bike removeBikeFromDock(Dock dock) {
        if (dock == null || dock.isEmpty()) {
            throw new IllegalStateException("Dock is empty or invalid.");
        }
        notifyListeners(this);
        return dock.removeBike();
    }

    public void setId(long l) {
        this.id = l;
    }
}
