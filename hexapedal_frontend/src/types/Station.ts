import { Dock } from "./Dock";

export interface Station {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    bikeCapacity: number;
    numberOfBikesDocked: number;
    docks?: Dock[];
}