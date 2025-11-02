package com.hexpedal.backend.controller;

import com.hexpedal.backend.model.MapEntity;
import com.hexpedal.backend.service.MapService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/api/map")
@RestController
public class MapController {

    private final MapService mapService;

    public MapController(MapService mapService) {
        this.mapService = mapService;
    }

    @GetMapping("/init-map-entities")
    public List<MapEntity> getMapEntities() {
        System.out.println("getMapEntities has been called");
        return mapService.getMapEntities();
    }
}