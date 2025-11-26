import { Station } from "./Station";

export enum DockingStationState {
  EMPTY = "empty",
  FULL = "full",
  OUT_OF_SERVICE = "out_of_service",
  ACTIVE = "active",
}


export interface DockingStation extends Station {
}

export interface CreateStationRequest {
  name: string;
  address: string;
  bikeCapacity: number;
  latitude: number;
  longitude: number;
}

export interface UpdateStationStateRequest {
  state: DockingStationState;
}

export interface UpdateStationPositionRequest {
  latitude: number;
  longitude: number;
}

export interface DockDTO {
  id: number;
}

export type AvailableDocksResponse = DockDTO[];

