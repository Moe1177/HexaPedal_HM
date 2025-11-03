import { Station } from "./Station";
import { Dock } from "./Dock";

interface BaseMapEntity {
    latitude: number;
    longitude: number;
}

export type MapEntity =
    | ({ type: "station" } & BaseMapEntity & Station)
    | ({ type: "dock" } & BaseMapEntity & Dock);