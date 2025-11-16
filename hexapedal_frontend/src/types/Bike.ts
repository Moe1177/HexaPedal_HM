/**
 * Enum matching backend BikeStatus
 */
export enum BikeStatus {
  AVAILABLE = "available",
  RESERVED = "reserved",
  ON_TRIP = "on_trip",
  MAINTENANCE = "maintenance",
}

/**
 * Bike interface matching backend Bike model
 */
export interface Bike {
  id: number;
  bikeStatus: BikeStatus;
  type: string;
  reservationExpDate?: string;
  reservationExpTime?: string;
  tripStartTime?: string;
  tripStartStationName?: string;
}

/**
 * Request DTO for creating a new bike
 */
export interface CreateBikeRequest {
  type: string;
  stationId: number;
  dockId: number;
}

/**
 * Request DTO for updating bike status
 */
export interface UpdateBikeStatusRequest {
  status: BikeStatus;
}

