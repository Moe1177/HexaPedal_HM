import { LatLngTuple } from 'leaflet';

export default function loadMapConfig() {
    return {
        center: [40, 20] as LatLngTuple,
        zoom: 5,
        style: {
            height: '500px',
            width: '100%',
        } as React.CSSProperties,
    };
}
