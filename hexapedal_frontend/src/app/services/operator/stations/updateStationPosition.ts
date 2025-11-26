import { API_BASE_URL } from "../../utils/constants";
import {
  UpdateStationPositionRequest,
  DockingStation,
} from "@/types/DockingStation";

// Updates a docking station's position
export async function updateStationPosition(
  stationId: number,
  request: UpdateStationPositionRequest,
  token: string
): Promise<DockingStation> {
  const response = await fetch(
    `${API_BASE_URL}/api/stations/${stationId}/position`,
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
      .catch(() => "Failed to update station position");
    throw new Error(errorText || "Failed to update station position");
  }

  const data: DockingStation = await response.json();
  return data;
}

