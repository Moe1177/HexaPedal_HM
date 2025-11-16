import { Dock } from "./Dock";
import { DockingStationState } from "./DockingStation";

export interface Station {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    bikeCapacity: number;
    numberOfBikesDocked: number;
    docks?: Dock[];
    state?: DockingStationState;
}