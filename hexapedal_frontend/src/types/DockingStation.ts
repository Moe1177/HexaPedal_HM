import { Station } from "./Station";

/**
 * Enum matching backend DockingStationStates
 */
export enum DockingStationState {
  EMPTY = "empty",
  FULL = "full",
  OUT_OF_SERVICE = "out_of_service",
  ACTIVE = "active",
}

/**
 * Extended Station interface for docking stations
 */
export interface DockingStation extends Station {
  // Inherits status from Station
}

/**
 * Request DTO for creating a new docking station
 */
export interface CreateStationRequest {
  name: string;
  address: string;
  bikeCapacity: number;
  latitude: number;
  longitude: number;
}

/**
 * Request DTO for updating a station's state
 */
export interface UpdateStationStateRequest {
  state: DockingStationState;
}

/**
 * Request DTO for updating a station's position
 */
export interface UpdateStationPositionRequest {
  latitude: number;
  longitude: number;
}

/**
 * DTO for available dock information
 */
export interface DockDTO {
  id: number;
}

/**
 * Response from getting available docks
 */
export type AvailableDocksResponse = DockDTO[];

