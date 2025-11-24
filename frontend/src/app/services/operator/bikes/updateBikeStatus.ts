import { API_BASE_URL } from "../../utils/constants";
import { Bike, BikeStatus } from "@/types/Bike";

/**
 * Updates a bike's status
 */
export async function updateBikeStatus(
  bikeId: number,
  status: BikeStatus,
  token: string
): Promise<Bike> {
  const response = await fetch(
    `${API_BASE_URL}/api/bikes/${bikeId}/status?status=${status}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to update bike status");
    throw new Error(errorText || "Failed to update bike status");
  }

  const data: Bike = await response.json();
  return data;
}

