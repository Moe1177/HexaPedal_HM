import { API_BASE_URL } from "../../utils/constants";
import { DockingStation } from "@/types/DockingStation";

/**
 * Fetches all docking stations
 */
export async function getAllStations(token: string): Promise<DockingStation[]> {
  const response = await fetch(`${API_BASE_URL}/api/stations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to fetch stations");
    throw new Error(errorText || "Failed to fetch stations");
  }

  const data: DockingStation[] = await response.json();
  return data;
}

