package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.Event;
import com.hexpedal.backend.model.events.DockingStationEvent;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventRepository extends CrudRepository<Event, UUID> {
    Optional<Event> findById(UUID id);

    List<Event> findAll();

    List<Event> findByDescriptionContainingIgnoreCase(String description);
}
