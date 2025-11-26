import { Bike } from "./Bike";

export interface Truck {
  id: number;
  capacity: number;
  bikes: Bike[];
}

export interface CreateTruckRequest {
  capacity: number;
}

