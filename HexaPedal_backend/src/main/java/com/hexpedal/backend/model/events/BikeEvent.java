package com.hexpedal.backend.model.events;

import com.hexpedal.backend.model.Event;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("BIKE")
public class BikeEvent extends Event {
    private static final String EVENT_TYPE = "BIKE";

    public BikeEvent() {
        super(EVENT_TYPE);
    }
}
