package com.hexpedal.backend.service;

import com.hexpedal.backend.model.Event;
import com.hexpedal.backend.repository.EventRepository;

import java.util.List;

public abstract class EventService {
    protected final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public abstract Event createEvent(String description);

    public List<Event> findByDescriptionContainingIgnoreCase(String description) {
        return eventRepository.findByDescriptionContainingIgnoreCase(description);
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }
}
