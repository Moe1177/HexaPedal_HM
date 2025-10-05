package com.hexpedal.backend.model;

import java.time.LocalDate;
import java.time.LocalTime;

public class Bike {
    private int id;
    private BikeStatus bikeStatus;
    private String type;
    private LocalDate reservationExpDate;
    private LocalTime reservationExpTime;  
    private static int idcounter;

    public Bike(String type) {
        this.id = ++idcounter;
        this.type = type;
        this.bikeStatus = BikeStatus.available;
        this.reservationExpDate = null;
        this.reservationExpTime = null;


    }



    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public BikeStatus getBikeStatus() {
        return bikeStatus;
    }

    public void setBikeStatus(BikeStatus bikeStatus) {
        this.bikeStatus = bikeStatus;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDate getReservationExpDate() {
        return reservationExpDate;
    }

    public void setReservationExpDate(LocalDate reservationExpDate) {
        this.reservationExpDate = reservationExpDate;
    }

    public LocalTime getReservationExpTime() {
        return reservationExpTime;
    }

    public void setReservationExpTime(LocalTime reservationExpTime) {
        this.reservationExpTime = reservationExpTime;
    }
 

}