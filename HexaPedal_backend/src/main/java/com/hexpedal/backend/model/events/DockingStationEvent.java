package com.hexpedal.backend.model.events;

import com.hexpedal.backend.model.Event;
import jakarta.persistence.*;

@Entity
@DiscriminatorValue("DOCKING_STATION")
public class DockingStationEvent extends Event {
    private static final String EVENT_TYPE = "DOCKING_STATION";

    public DockingStationEvent() {
        super(EVENT_TYPE);
    }
}
