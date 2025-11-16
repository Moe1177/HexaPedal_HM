import "leaflet/dist/leaflet.css";
import MapServer from "../ui/map/MapServer";

interface MapViewProps {
    onBikeReserved?: (bikeId: number) => void;
    isOperatorView?: boolean;
    onEditState?: (stationId: number) => void;
    onEditPosition?: (stationId: number) => void;
    onDelete?: (stationId: number) => void;
}

export default function MapView({ 
    onBikeReserved,
    isOperatorView = false,
    onEditState,
    onEditPosition,
    onDelete
}: MapViewProps = {}) {
    return (
        <MapServer 
            onBikeReserved={onBikeReserved}
            isOperatorView={isOperatorView}
            onEditState={onEditState}
            onEditPosition={onEditPosition}
            onDelete={onDelete}
        />
    );
}