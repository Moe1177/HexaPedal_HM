'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '@/app/services/utils/constants';
import { useMapEntities } from '@/hooks/useMapEntities';
import EntityMarker from '../EntityMarker';
import StationDetailsModal from '../StationDetailsModal';

interface MapClientProps {
    onBikeReserved?: (bikeId: number) => void;
    isOperatorView?: boolean;
    onEditState?: (stationId: number) => void;
    onEditPosition?: (stationId: number) => void;
    onDelete?: (stationId: number) => void;
}

export default function MapClient({ 
    onBikeReserved,
    isOperatorView = false,
    onEditState,
    onEditPosition,
    onDelete
}: MapClientProps = {}) {
    const { entities } = useMapEntities();
    const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleStationClick = (stationId: number) => {
        if (!isOperatorView) {
            setSelectedStationId(stationId);
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStationId(null);
    };

    const handleReserveBike = (bikeId: number) => {
        // Call the parent callback to update dashboard state
        if (onBikeReserved) {
            onBikeReserved(bikeId);
        }
        console.log(`Bike ${bikeId} reserved`);
    };

    if (!isMounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <>
            <MapContainer {...MAP_CONFIG} key="main-map">
                <TileLayer
                    key="osm-tiles"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {entities.map((entity) => (
                    <EntityMarker
                        key={`${entity.id}-${entity.type === 'station' ? (entity as any).status : ''}`}
                        entity={entity}
                        onStationClick={handleStationClick}
                        isOperatorView={isOperatorView}
                        onEditState={onEditState}
                        onEditPosition={onEditPosition}
                        onDelete={onDelete}
                    />
                ))}
            </MapContainer>
            {!isOperatorView && (
                <StationDetailsModal
                    stationId={selectedStationId}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onReserveBike={handleReserveBike}
                />
            )}
        </>
    );
}