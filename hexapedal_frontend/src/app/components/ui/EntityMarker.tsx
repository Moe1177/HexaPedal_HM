'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapEntity } from '@/types/MapEntity';
import { DockingStationState } from '@/types/DockingStation';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface EntityMarkerProps {
    entity: MapEntity;
    onStationClick?: (stationId: number) => void;
    isOperatorView?: boolean;
    onEditState?: (stationId: number) => void;
    onEditPosition?: (stationId: number) => void;
    onDelete?: (stationId: number) => void;
}

// Create custom colored icons based on station fullness (DM-03)
// Color scheme based on fullness percentage:
// - Red (#ef4444): 0% or 100% fullness (empty/full)
// - Yellow (#eab308): <25% or >85% fullness (almost empty/almost full)
// - Green (#10b981): 25%-85% fullness (balanced)
const createColoredIcon = (numberOfBikesDocked?: number, bikeCapacity?: number) => {
    let color = '#10b981'; // default green (balanced)
    
    if (numberOfBikesDocked !== undefined && bikeCapacity !== undefined && bikeCapacity > 0) {
        const fullnessPercent = (numberOfBikesDocked / bikeCapacity) * 100;
        
        // Red: 0% or 100%
        if (fullnessPercent === 0 || fullnessPercent === 100) {
            color = '#ef4444'; // red
        }
        // Yellow: <25% or >85%
        else if (fullnessPercent < 25 || fullnessPercent > 85) {
            color = '#eab308'; // yellow
        }
        // Green: 25%-85% (balanced)
        else {
            color = '#10b981'; // green
        }
    }

    return L.divIcon({
        html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50% 50% 50% 0; border: 2px solid white; transform: rotate(-45deg); box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 25],
        popupAnchor: [0, -25],
        className: 'custom-marker-icon',
    });
};

export default function EntityMarker({ 
    entity, 
    onStationClick,
    isOperatorView = false,
    onEditState,
    onEditPosition,
    onDelete
}: EntityMarkerProps) {
    const position: [number, number] = [entity.latitude, entity.longitude];

    const handleMarkerClick = () => {
        if (entity.type === "station" && onStationClick) {
            onStationClick(entity.id);
        }
    };

    // Use colored icon for stations based on fullness
    const icon = entity.type === "station" 
        ? createColoredIcon(entity.numberOfBikesDocked, entity.bikeCapacity) 
        : undefined;

    return (
        <Marker 
            position={position}
            icon={icon}
            eventHandlers={{
                click: handleMarkerClick,
            }}
        >
            <Popup>
                {entity.type === "station" && (
                    <div className="min-w-[200px]">
                        <div className="font-bold text-base mb-1">{entity.name}</div>
                        <div className="text-sm text-neutral-600 mb-2">{entity.address}</div>
                        
                        {(entity as any).status && (
                            <div className="mb-2">
                                <span className="text-xs font-medium">Status: </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    (entity as any).status === DockingStationState.ACTIVE
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : (entity as any).status === DockingStationState.OUT_OF_SERVICE
                                        ? 'bg-red-100 text-red-700'
                                        : (entity as any).status === DockingStationState.FULL
                                        ? 'bg-sky-100 text-sky-700'
                                        : 'bg-neutral-100 text-neutral-700'
                                }`}>
                                    {(entity as any).status}
                                </span>
                            </div>
                        )}
                        
                        <div className="text-sm mb-2">
                            Bikes: {entity.numberOfBikesDocked}/{entity.bikeCapacity}
                        </div>
                        
                        {!isOperatorView ? (
                            <button
                                onClick={() => onStationClick?.(entity.id)}
                                className="w-full mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
                            >
                                View Details
                            </button>
                        ) : (
                            <div className="flex flex-col gap-1 mt-2">
                                <button
                                    onClick={() => onEditState?.(entity.id)}
                                    className="w-full px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
                                >
                                    Edit State
                                </button>
                                <button
                                    onClick={() => onEditPosition?.(entity.id)}
                                    className="w-full px-3 py-1.5 bg-sky-600 text-white rounded text-sm hover:bg-sky-700 transition-colors"
                                >
                                    Edit Position
                                </button>
                                <button
                                    onClick={() => onDelete?.(entity.id)}
                                    className="w-full px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Popup>
        </Marker>
    );
}
