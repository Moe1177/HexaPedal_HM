import { API_BASE_URL } from "../../utils/constants";
import {
  UpdateStationStateRequest,
  DockingStation,
} from "@/types/DockingStation";

// Updates a docking station's state
export async function updateStationState(
  stationId: number,
  request: UpdateStationStateRequest,
  token: string
): Promise<DockingStation> {
  const response = await fetch(
    `${API_BASE_URL}/api/stations/${stationId}/state`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to update station state");
    throw new Error(errorText || "Failed to update station state");
  }

  const data: DockingStation = await response.json();
  return data;
}

