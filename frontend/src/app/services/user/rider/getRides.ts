import { API_BASE_URL } from "../../utils/constants";
import { Trip } from "@/types/Trip";

interface BackendRide {
  ride_id: number;
  bikeId: number | null;
  startLocation: string;
  endLocation: string;
  startTimestamp: string;
  endTimestamp: string;
  duration: number;
  distance: number;
  cost: number; // This is already the final cost after flex dollars
  flexDollarsUsed: number | null;
}

function mapBackendRideToTrip(backendRide: BackendRide): Trip {
  const hasEnded = backendRide.endTimestamp != null;

  // Generate IDs from location strings
  const startStationId = Math.abs(hashString(backendRide.startLocation));
  const endStationId = hasEnded
    ? Math.abs(hashString(backendRide.endLocation))
    : null;

  return {
    id: backendRide.ride_id,
    bikeId: backendRide.bikeId ?? undefined,
    userId: 0, 
    startStationId,
    startStationName: backendRide.startLocation,
    endStationId,
    endStationName: hasEnded ? backendRide.endLocation : undefined,
    startedAt: backendRide.startTimestamp,
    endedAt: hasEnded ? backendRide.endTimestamp : null,
    duration: backendRide.duration,
    cost: backendRide.cost,
    status: hasEnded ? "completed" : "active",
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

export async function getRides(
  userId: number | null,
  token?: string | null
): Promise<Trip[]> {
  if (!token) {
    throw new Error("Token is required");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE_URL}/api/ride-history/me`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to fetch rides");
    throw new Error(errorText || "Failed to fetch rides");
  }

  const data: BackendRide[] = await response.json();

  // Map backend rides to frontend Trip format
  const trips = data.map((ride) => {
    const trip = mapBackendRideToTrip(ride);
    trip.userId = userId ?? 0;
    return trip;
  });

  return trips;
}
