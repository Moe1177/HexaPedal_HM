"use client";

import { useContext } from "react";
import { MapEntitiesContext } from "@/app/providers/MapEntitiesProvider";

export function useMapEntities() {
    const context = useContext(MapEntitiesContext);
    if (!context) {
        throw new Error("useMapEntities must be used within a MapEntitiesProvider");
    }
    return context;
}
