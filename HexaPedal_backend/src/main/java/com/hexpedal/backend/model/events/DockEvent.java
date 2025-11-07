package com.hexpedal.backend.model.events;

import com.hexpedal.backend.model.Event;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("DOCK")
public class DockEvent extends Event {
    private static final String EVENT_TYPE = "DOCK";

    public DockEvent() {
        super(EVENT_TYPE);
    }
}
