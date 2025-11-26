import { API_BASE_URL } from "../../utils/constants";

export interface ActiveTripStatus {
  hasActiveTrip: boolean;
  bikeId: number | null;
  userId: number | null;
  bikeType: string | null;
  startedAt: string | null;
  startStationName: string | null;
  destinationStationName: string | null;
  destinationStationId: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}

export async function getCurrentTrip(token: string): Promise<ActiveTripStatus> {
  const response = await fetch(
    `${API_BASE_URL}/api/trips/current`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  // If no trip exists, return a "no trip" response
  if (response.status === 404 || response.status === 204) {
    return {
      hasActiveTrip: false,
      bikeId: null,
      userId: null,
      bikeType: null,
      startedAt: null,
      startStationName: null,
      destinationStationName: null,
      destinationStationId: null,
      destinationLatitude: null,
      destinationLongitude: null,
    };
  }

  if (!response.ok) {
    throw new Error("Failed to fetch current trip");
  }

  return await response.json();
}

