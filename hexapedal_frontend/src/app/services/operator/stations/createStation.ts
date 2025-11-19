import { API_BASE_URL } from "../../utils/constants";
import { CreateStationRequest, DockingStation } from "@/types/DockingStation";

/**
 * Creates a new docking station
 */
export async function createStation(
  request: CreateStationRequest,
  token: string
): Promise<DockingStation> {
  const response = await fetch(`${API_BASE_URL}/api/stations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to create station");
    throw new Error(errorText || "Failed to create station");
  }

  const data: DockingStation = await response.json();
  return data;
}

