
export enum BikeStatus {
  AVAILABLE = "available",
  RESERVED = "reserved",
  ON_TRIP = "on_trip",
  MAINTENANCE = "maintenance",
}

export interface Bike {
  id: number;
  bikeStatus: BikeStatus;
  type: string;
  reservationExpDate?: string;
  reservationExpTime?: string;
  tripStartTime?: string;
  tripStartStationName?: string;
  currentStationName?: string;
  currentStationId?: number;
}

export interface CreateBikeRequest {
  type: string;
  stationId: number;
  dockId: number;
}

export interface UpdateBikeStatusRequest {
  status: BikeStatus;
}

