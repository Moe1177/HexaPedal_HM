import { Bike } from "./Bike";

/**
 * Truck interface matching backend Truck model
 */
export interface Truck {
  id: number;
  capacity: number;
  bikes: Bike[];
}

/**
 * Request DTO for creating a new truck
 */
export interface CreateTruckRequest {
  capacity: number;
}

