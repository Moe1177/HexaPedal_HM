'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapEntity } from '@/types/MapEntity';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function EntityMarker({ entity }: { entity: MapEntity }) {
    const position: [number, number] = [entity.latitude, entity.longitude];

    return (
        <Marker position={position}>
            <Popup>
                {entity.type === "station" && (
                    <>
                        <strong>{entity.name}</strong>
                        <br />
                        {entity.address}
                        <br />
                        Bikes Docked: {entity.numberOfBikesDocked}/{entity.bikeCapacity}
                    </>
                )}
            </Popup>
        </Marker>
    );
}
