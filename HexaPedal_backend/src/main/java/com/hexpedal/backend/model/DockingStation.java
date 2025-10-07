package com.hexpedal.backend.model;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "docking_stations")
public class DockingStation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DockingStationStates status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PositionStates position;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private int bikeCapacity;

 
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "station_id")
    private List<Dock> docks = new ArrayList<>();


    private LocalTime reservationholdTime;

 
    public DockingStation() {}

    public DockingStation(String name, PositionStates position, String address, int bikeCapacity) {
        this.name = name;
        this.status = DockingStationStates.active;
        this.position = position;
        this.address = address;
        this.bikeCapacity = bikeCapacity;
        this.docks = new ArrayList<>();
    
        for (int i = 0; i < bikeCapacity; i++) {
            this.docks.add(new Dock());
        }
    }
    
    

    public Long getId() {
         return id; 
    }
    public void setId(Long id) { 
        this.id = id;
    }

    public String getName() { 
        return name;
    }
    public void setName(String name) { 
        this.name = name;
    }

   
    public DockingStationStates getStationState() { 
        return status;
    }
    public void setStationState(DockingStationStates status) { 
        this.status = status;
    }

    public PositionStates getPosition() { 
        return position;
    }
    public void setPosition(PositionStates position) { 
        this.position = position;
    }

    public String getAddress() { 
        return address;
    }
    public void setAddress(String address) { 
        this.address = address;
    }

    public int getBikeCapacity() { 
        return bikeCapacity;
    }
    public void setBikeCapacity(int bikeCapacity) { 
        this.bikeCapacity = bikeCapacity;
    }

    public List<Dock> getDocks() { 
        return docks;
    }
    public void setDocks(List<Dock> docks) {
        this.docks = (docks != null) ? docks : new ArrayList<>();
    }

    public LocalTime getReservationholdTime() { 
        return reservationholdTime; 
    }
    public void setReservationholdTime(LocalTime reservationholdTime) { 
        this.reservationholdTime = reservationholdTime; 
    }

  
    public int getNumberOfBikesDocked() {
        int count = 0;
        for (Dock d : docks) {
            if (d != null && !d.isEmpty()) count++;
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
    }

    
    public void removeDock(Dock dock) {
        if (dock == null) return;
        if (!dock.isEmpty()) {
            throw new IllegalStateException("Cannot remove a dock that holds a bike.");
        }
        docks.remove(dock);
    }

    public void placeBikeIntoEmptyDock(Bike bike) {
        Dock empty = findEmptyDock();
        if (empty == null) throw new IllegalStateException("No empty dock available.");
        empty.assignBike(bike);
    }

    public Bike removeBikeFromDock(Dock dock) {
        if (dock == null || dock.isEmpty()) {
            throw new IllegalStateException("Dock is empty or invalid.");
        }
        return dock.removeBike();
    }

}
