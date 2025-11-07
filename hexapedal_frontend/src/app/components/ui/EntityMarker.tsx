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

interface EntityMarkerProps {
    entity: MapEntity;
    onStationClick?: (stationId: number) => void;
}

export default function EntityMarker({ entity, onStationClick }: EntityMarkerProps) {
    const position: [number, number] = [entity.latitude, entity.longitude];

    const handleMarkerClick = () => {
        if (entity.type === "station" && onStationClick) {
            onStationClick(entity.id);
        }
    };

    return (
        <Marker 
            position={position}
            eventHandlers={{
                click: handleMarkerClick,
            }}
        >
            <Popup>
                {entity.type === "station" && (
                    <>
                        <strong>{entity.name}</strong>
                        <br />
                        {entity.address}
                        <br />
                        Bikes Docked: {entity.numberOfBikesDocked}/{entity.bikeCapacity}
                        <br />
                        <button
                            onClick={() => onStationClick?.(entity.id)}
                            className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                        >
                            View Details
                        </button>
                    </>
                )}
            </Popup>
        </Marker>
    );
}
