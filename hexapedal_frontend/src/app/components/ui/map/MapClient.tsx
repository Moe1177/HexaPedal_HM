'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '@/app/services/utils/constants';
import { useMapEntities } from '@/hooks/useMapEntities';
import EntityMarker from '../EntityMarker';

export default function MapClient() {
    const { entities } = useMapEntities();

    return (
        <MapContainer {...MAP_CONFIG}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {entities.map((entity) => (
                <EntityMarker key={entity.id} entity={entity} />
            ))}
        </MapContainer>
    );
}