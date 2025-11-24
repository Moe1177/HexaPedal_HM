import { API_BASE_URL } from "../../utils/constants";

/**
 * Bike interface for station bikes
 */
export interface Bike {
  id: number;
  bikeStatus?: string;
  // Add other bike properties as needed
}

/**
 * Fetches all bikes at a specific docking station
 */
export async function getStationBikes(
  stationId: number,
  token: string
): Promise<Bike[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/stations/${stationId}/bikes`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to fetch station bikes");
    throw new Error(errorText || "Failed to fetch station bikes");
  }

  const data: Bike[] = await response.json();
  return data;
}

