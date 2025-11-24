import { API_BASE_URL } from "../../utils/constants";

/**
 * Deletes a docking station
 */
export async function deleteStation(
  stationId: number,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/stations/${stationId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to delete station");
    throw new Error(errorText || "Failed to delete station");
  }

  // 204 No Content response, nothing to return
}

