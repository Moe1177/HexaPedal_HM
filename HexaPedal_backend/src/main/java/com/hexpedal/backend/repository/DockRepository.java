package com.hexpedal.backend.repository;
import org.springframework.data.repository.CrudRepository;

import com.hexpedal.backend.model.Dock;

public interface DockRepository extends CrudRepository<Dock,Long> {
    
}
