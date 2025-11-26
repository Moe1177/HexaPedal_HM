import { API_BASE_URL } from "../../utils/constants";
import { CreateStationRequest, DockingStation } from "@/types/DockingStation";

// Creates a new docking station
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
    let errorMessage = "Failed to create station";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage;
      } else {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
      if (response.status === 409) {
        errorMessage = "A station with this name or at these coordinates already exists.";
      }
    }
    throw new Error(errorMessage);
  }

  const data: DockingStation = await response.json();
  return data;
}

