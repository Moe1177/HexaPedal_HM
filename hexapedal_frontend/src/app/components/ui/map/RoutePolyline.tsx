'use client';

import { Polyline } from 'react-leaflet';
import { RouteCoordinate } from '@/app/services/routing/getRoute';

interface RoutePolylineProps {
  coordinates: RouteCoordinate[];
}

// Displays a navigation route on the map as a colored polyline
export default function RoutePolyline({ coordinates }: RoutePolylineProps) {
  // Convert RouteCoordinate[] to [lat, lng][] format for Leaflet
  const positions: [number, number][] = coordinates.map(coord => [coord.lat, coord.lng]);

  console.log("RoutePolyline rendering with", positions.length, "positions");

  if (positions.length < 2) {
    console.warn("RoutePolyline: Not enough positions to draw route");
    return null;
  }

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#000000',
          weight: 8,
          opacity: 0.2,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Main route line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#3B82F6', 
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </>
  );
}

