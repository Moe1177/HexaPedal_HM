import "leaflet/dist/leaflet.css";
import MapServer from "../ui/map/MapServer";

interface MapViewProps {
    onBikeReserved?: (bikeId: number) => void;
}

export default function MapView({ onBikeReserved }: MapViewProps = {}) {
    return (
        <MapServer onBikeReserved={onBikeReserved} />
    );
}