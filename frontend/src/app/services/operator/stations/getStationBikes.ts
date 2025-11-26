import { API_BASE_URL } from "../../utils/constants";

export interface Bike {
  id: number;
  bikeStatus?: string;
}

// Gets all bikes from a specific docking station
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

