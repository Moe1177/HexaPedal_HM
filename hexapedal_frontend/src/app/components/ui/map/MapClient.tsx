'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapClient() {
    return (
        <MapContainer center={[40, 20]} zoom={5} style={{ height: '500px', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CircleMarker
                center={[40.609787846393196, 20.7890265133657]}
                radius={10}
                color="transparent"
                fillColor="green"
                fillOpacity={0.5}
            >
                <Popup>
                    <h2>Hello World</h2>
                </Popup>
            </CircleMarker>
        </MapContainer>
    );
}