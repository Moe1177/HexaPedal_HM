import { MapEntity } from "@/types/MapEntity";
import { API_BASE_URL } from "./constants";

export async function loadMapEntities() {
    const baseUrl = API_BASE_URL;
    const res = await fetch(`${baseUrl}/api/map/init-map-entities`);
    if (!res.ok) {
        throw new Error(`Failed to fetch station markers: ${res.statusText}`);
    }
    const data = await res.json();

    return data.map((entity: any): MapEntity => {
        if ('bikeCapacity' in entity) {
            return { ...entity, type: 'station' } as MapEntity;
        } else if ('empty' in entity) {
            return { ...entity, type: 'dock' } as MapEntity;
        } else {
            throw new Error(`Unknown entity type for id=${entity.id}`);
        }
    });
}
