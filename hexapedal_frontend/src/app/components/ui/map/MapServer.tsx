'use client';

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), { ssr: false });

interface MapServerProps {
    onBikeReserved?: (bikeId: number) => void;
}

export default function MapServer({ onBikeReserved }: MapServerProps = {}) {
    return <MapClient onBikeReserved={onBikeReserved} />;
}