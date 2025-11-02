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

    /**
     * Observer design pattern, this class will notify its listener instances to trigger their "update" behaviors
     * @param updatedState the updated state of the object
     */
    public void notifyListeners(MapEntity updatedState) {
        for (MapEntityListener mapEntityListener : mapEntityListeners) {
            mapEntityListener.update(updatedState);
        }
    }

    /**
     * Adding instances interested to any change regarding this object
     * @param mapEntityListener the interested instance
     */
    public void addListener(MapEntityListener mapEntityListener) {
        this.mapEntityListeners.add(mapEntityListener);
    }

    /**
     * Removing instances not interested to changes regarding this object
     * @param mapEntityListener the uninterested instance
     */
    public void removeListener(MapEntityListener mapEntityListener) {
        this.mapEntityListeners.remove(mapEntityListener);
    }
}
