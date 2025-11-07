package com.hexpedal.backend.service.events;

import com.hexpedal.backend.model.events.DockingStationEvent;
import com.hexpedal.backend.model.Event;
import com.hexpedal.backend.repository.EventRepository;
import com.hexpedal.backend.service.EventService;
import org.springframework.stereotype.Service;

@Service
public class DockingStationEventService extends EventService {

    public DockingStationEventService(EventRepository eventRepository) {
        super(eventRepository);
    }

    @Override
    public Event createEvent(String description) {
        DockingStationEvent event = new DockingStationEvent();
        event.setDescription(description);
        return eventRepository.save(event);
    }
}
