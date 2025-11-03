import MapView from "../components/views/MapView";
import { MapEntitiesProvider } from "../providers/MapEntitiesProvider";

export default function DashboardPage() {
    return (
        <div className="h-full">
            <MapEntitiesProvider>
                <MapView />
            </MapEntitiesProvider>
        </div>
    );
}