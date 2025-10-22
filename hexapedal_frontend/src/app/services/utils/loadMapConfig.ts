import { LatLngTuple } from 'leaflet';
import { API_BASE_URL } from './constants';

export const fallBackMapConfig = {
    center: [40, 20] as LatLngTuple,
    zoom: 5,
    style: {
        height: '100%',
        width: '100%',
    } as React.CSSProperties,
};

export default async function loadMapConfig() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/map/config`);
        const mapConfig = await response.json();

        return {
            center: mapConfig.center as LatLngTuple,
            zoom: mapConfig.zoom,
            style: {
                height: '100%',
                width: '100%',
            } as React.CSSProperties,
        };
    } catch (error) {
        console.error('Error loading map config:', error);
        return fallBackMapConfig;
    }
}
