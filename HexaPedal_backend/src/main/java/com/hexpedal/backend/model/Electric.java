package com.hexpedal.backend.model;

public class Electric extends Bike {
    private int batteryLevel;

    public Electric() {
        super("Electric");
        this.batteryLevel = 100;
    }
    public int getBatteryLevel() {
        return batteryLevel;
    }
    public void setBatteryLevel(int batteryLevel) {
        this.batteryLevel = batteryLevel;
    }
}
