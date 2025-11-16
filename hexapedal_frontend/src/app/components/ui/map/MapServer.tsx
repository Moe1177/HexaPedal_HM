'use client';

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), { ssr: false });

interface MapServerProps {
    onBikeReserved?: (bikeId: number) => void;
    isOperatorView?: boolean;
    onEditState?: (stationId: number) => void;
    onEditPosition?: (stationId: number) => void;
    onDelete?: (stationId: number) => void;
}

export default function MapServer({ 
    onBikeReserved,
    isOperatorView = false,
    onEditState,
    onEditPosition,
    onDelete
}: MapServerProps = {}) {
    return (
        <MapClient 
            onBikeReserved={onBikeReserved}
            isOperatorView={isOperatorView}
            onEditState={onEditState}
            onEditPosition={onEditPosition}
            onDelete={onDelete}
        />
    );
}