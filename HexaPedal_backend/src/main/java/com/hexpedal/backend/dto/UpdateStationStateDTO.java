package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.DockingStationStates;

public class UpdateStationStateDTO {
    private DockingStationStates state;

    public DockingStationStates getState() {
        return state;
    }
    public void setState(DockingStationStates state) {
        this.state = state;
    }
}