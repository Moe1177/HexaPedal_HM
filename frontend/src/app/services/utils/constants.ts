import { LatLngTuple } from "leaflet";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const MAP_CONFIG = {
    center: [45.5019, -73.5674] as LatLngTuple,
    zoom: 12,
    style: {
        height: '100%',
        width: '100%',
    } as React.CSSProperties,
};