package com.hexpedal.backend.service.events;

import com.hexpedal.backend.model.Event;
import com.hexpedal.backend.model.events.DockEvent;
import com.hexpedal.backend.repository.EventRepository;
import com.hexpedal.backend.service.EventService;
import org.springframework.stereotype.Service;

@Service
public class DockEventService extends EventService {

    public DockEventService(EventRepository eventRepository) {
        super(eventRepository);
    }

    @Override
    public Event createEvent(String description) {
        DockEvent event = new DockEvent();
        event.setDescription(description);
        return eventRepository.save(event);
    }
}
