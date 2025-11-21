package com.hexpedal.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Transient;
import lombok.Getter;
import java.util.List;
import java.util.ArrayList;

@Getter
public abstract class MapEntity {
    @JsonIgnore
    @Transient
    private final List<MapEntityListener> mapEntityListeners;

    public MapEntity() {
        this.mapEntityListeners = new ArrayList<>();
    }


    public void notifyListeners(MapEntity updatedState) {
        for (MapEntityListener mapEntityListener : mapEntityListeners) {
            mapEntityListener.update(updatedState);
        }
    }


    public void addListener(MapEntityListener mapEntityListener) {
        this.mapEntityListeners.add(mapEntityListener);
    }


    public void removeListener(MapEntityListener mapEntityListener) {
        this.mapEntityListeners.remove(mapEntityListener);
    }


    public void copyListenersFrom(MapEntity other) {
        this.mapEntityListeners.clear();
        this.mapEntityListeners.addAll(other.getMapEntityListeners());
    }
}
