import { MapEntity } from "@/types/MapEntity";

export async function loadMapEntities() {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/map/init-map-entities');
    if (!res.ok) {
        throw new Error(`Failed to fetch station markers: ${res.statusText}`);
    }
    const data = await res.json();

    // Add `type` based on which fields exist
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
