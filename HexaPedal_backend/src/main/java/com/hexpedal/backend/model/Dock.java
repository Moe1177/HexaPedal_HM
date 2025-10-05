package com.hexpedal.backend.model;

import java.time.LocalTime;

public class Dock {
    private Bike bike;
    private LocalTime expiresAfterMin; 

    public Dock() {
    
    }
    public Bike getBike() {
        return bike;
    }
    public void setBike(Bike bike) {
        this.bike = bike;
    }
    public LocalTime getExpiresAfterMin() {
        return expiresAfterMin;
    }
    public void setExpiresAfterMin(LocalTime expiresAfterMin) {
        this.expiresAfterMin = expiresAfterMin;
    }
    public boolean isEmpty() {
        return this.bike == null;
    }

}
