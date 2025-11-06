'use client';

import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '@/app/services/utils/constants';
import { useMapEntities } from '@/hooks/useMapEntities';
import EntityMarker from '../EntityMarker';
import StationDetailsModal from '../StationDetailsModal';

interface MapClientProps {
    onBikeReserved?: (bikeId: number) => void;
}

export default function MapClient({ onBikeReserved }: MapClientProps = {}) {
    const { entities } = useMapEntities();
    const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleStationClick = (stationId: number) => {
        setSelectedStationId(stationId);
        setIsModalOpen(true);
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

    return (
        <>
            <MapContainer {...MAP_CONFIG}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {entities.map((entity) => (
                    <EntityMarker
                        key={entity.id}
                        entity={entity}
                        onStationClick={handleStationClick}
                    />
                ))}
            </MapContainer>
            <StationDetailsModal
                stationId={selectedStationId}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onReserveBike={handleReserveBike}
            />
        </>
    );
}