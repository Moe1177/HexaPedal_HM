package com.hexpedal.backend.model;

import lombok.Getter;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

public class Map {
    @Getter
    @Setter
    // Initialized after initialization of the map service, see ../service/MapService
    private List<MapEntity> mapEntities = new ArrayList<>();
    private static Map instance;

    private Map() {}

    public static Map getInstance() {
        if (instance == null) {
            instance = new Map();
        }
        return instance;
    }
}
