import { API_BASE_URL } from "../../utils/constants";
import { AvailableDocksResponse } from "@/types/DockingStation";

// Gets available docks from a specific station
export async function getAvailableDocks(
  stationId: number,
  token: string
): Promise<AvailableDocksResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/stations/${stationId}/docks/available`,
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
      .catch(() => "Failed to fetch available docks");
    throw new Error(errorText || "Failed to fetch available docks");
  }

  const data: AvailableDocksResponse = await response.json();
  return data;
}

