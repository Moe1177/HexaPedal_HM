import "leaflet/dist/leaflet.css";
import MapServer from "../ui/map/MapServer";
import { MapEntitiesProvider } from "@/app/providers/MapEntitiesProvider";

export default function MapView() {
    return (
        <MapEntitiesProvider>
            <MapServer />
        </MapEntitiesProvider>
    );
}