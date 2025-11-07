package com.hexpedal.backend.service.events;

import com.hexpedal.backend.model.Event;
import com.hexpedal.backend.repository.EventRepository;
import com.hexpedal.backend.service.EventService;
import org.springframework.stereotype.Service;

@Service
public class BikeEventService extends EventService {

    public BikeEventService(EventRepository eventRepository) {
        super(eventRepository);
    }

    @Override
    public Event createEvent(String description) {
        return null;
    }
}
