'use client';

import dynamic from 'next/dynamic';
import { RouteCoordinate } from '@/app/services/routing/getRoute';

const MapClient = dynamic(() => import('./MapClient'), { ssr: false });

interface MapServerProps {
    onBikeReserved?: (bikeId: number) => void;
    isOperatorView?: boolean;
    onEditState?: (stationId: number) => void;
    onEditPosition?: (stationId: number) => void;
    onDelete?: (stationId: number) => void;
    routeCoordinates?: RouteCoordinate[];
}

export default function MapServer({ 
    onBikeReserved,
    isOperatorView = false,
    onEditState,
    onEditPosition,
    onDelete,
    routeCoordinates
}: MapServerProps = {}) {
    return (
        <MapClient 
            onBikeReserved={onBikeReserved}
            isOperatorView={isOperatorView}
            onEditState={onEditState}
            onEditPosition={onEditPosition}
            onDelete={onDelete}
            routeCoordinates={routeCoordinates}
        />
    );
}