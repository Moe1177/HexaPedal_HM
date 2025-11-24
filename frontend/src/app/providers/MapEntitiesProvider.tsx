"use client";

import { createContext, useEffect, useState, useCallback } from "react";
import { MapEntity } from "@/types/MapEntity";
import { loadMapEntities } from "../services/utils/loadMapEntities";

export interface MapEntitiesContextType {
    entities: MapEntity[];
    setEntities: React.Dispatch<React.SetStateAction<MapEntity[]>>;
    reloadEntities: () => Promise<void>;
}

export const MapEntitiesContext = createContext<MapEntitiesContextType | undefined>(undefined);

export function MapEntitiesProvider({ children }: { children: React.ReactNode }) {
    const [entities, setEntities] = useState<MapEntity[]>([]);

    const reloadEntities = useCallback(async () => {
        try {
            const data = await loadMapEntities();
            setEntities(data);
        } catch (error) {
            console.error("Failed to fetch map entities:", error);
        }
    }, []);

    useEffect(() => {
        reloadEntities();
    }, [reloadEntities]);

    return (
        <MapEntitiesContext.Provider value={{ entities, setEntities, reloadEntities }}>
            {children}
        </MapEntitiesContext.Provider>
    );
}
