package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.DockingStationStates;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class UpdateStationStateDTO {
    private DockingStationStates state;
}