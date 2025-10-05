package com.hexpedal.backend.model;
import java.time.LocalTime;
import java.util.List;

public class DockingStation {
    private String name;
    private DockingStationStates status;
    private PositionStates position;
    private String address;
    private int bikeCapacity;
    private int nbBikesDocked;
    private List<Bike> listBikesDocked;
    private LocalTime reservationholdTime;
 
    public DockingStation(String name, PositionStates position, String address, int bikeCapacity) {
        this.name = name;
        this.status = DockingStationStates.active;
        this.position = position;
        this.address = address;
        this.bikeCapacity = bikeCapacity;
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
    public int getNbBikesDocked() {
        return nbBikesDocked;
    }
    public void setNbBikesDocked(int nbBikesDocked) {
        this.nbBikesDocked = nbBikesDocked;
    }
    public List<Bike> getListBikesDocked() {
        return listBikesDocked;
    }
    public void setListBikesDocked(List<Bike> listBikesDocked) {
        this.listBikesDocked = listBikesDocked;
    }
    public LocalTime getReservationholdTime() {
        return reservationholdTime;
    }
    public void setReservationholdTime(LocalTime reservationholdTime) {
        this.reservationholdTime = reservationholdTime;
    }
    




















}
