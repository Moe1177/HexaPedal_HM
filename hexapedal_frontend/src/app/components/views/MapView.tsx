import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MapServer from "../ui/map/MapWrapper";

export default function MapView() {
    return (
        <div>
            <MapServer />
        </div>
    );
}