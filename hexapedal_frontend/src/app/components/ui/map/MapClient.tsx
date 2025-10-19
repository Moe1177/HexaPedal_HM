'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useMapConfig from '@/hooks/useMapConfig';

export default function MapClient() {
    const [mapConfig, setMapConfig] = useMapConfig();
    return (
        <MapContainer {...mapConfig}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
        </MapContainer>
    );
}