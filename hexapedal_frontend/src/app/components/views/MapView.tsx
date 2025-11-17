import "leaflet/dist/leaflet.css";
import MapServer from "../ui/map/MapServer";
import { RouteCoordinate } from "@/app/services/routing/getRoute";

interface MapViewProps {
    onBikeReserved?: (bikeId: number) => void;
    isOperatorView?: boolean;
    onEditState?: (stationId: number) => void;
    onEditPosition?: (stationId: number) => void;
    onDelete?: (stationId: number) => void;
    routeCoordinates?: RouteCoordinate[];
}

export default function MapView({ 
    onBikeReserved,
    isOperatorView = false,
    onEditState,
    onEditPosition,
    onDelete,
    routeCoordinates
}: MapViewProps = {}) {
    return (
        <MapServer 
            onBikeReserved={onBikeReserved}
            isOperatorView={isOperatorView}
            onEditState={onEditState}
            onEditPosition={onEditPosition}
            onDelete={onDelete}
            routeCoordinates={routeCoordinates}
        />
    );
}