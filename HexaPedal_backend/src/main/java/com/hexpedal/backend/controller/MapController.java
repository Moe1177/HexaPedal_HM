package com.hexpedal.backend.controller;

import com.hexpedal.backend.service.MapService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/api/map")
@RestController
public class MapController {

    private final MapService mapService;

    public MapController(MapService mapService) {
        this.mapService = mapService;
    }

    @GetMapping("/config")
    public String getMapConfig() {
        System.out.println("getMapConfig");
        return mapService.loadMapConfig();
    }
}