import { API_BASE_URL } from "../../utils/constants";
import { Bike } from "@/types/Bike";

/**
 * Fetches all bikes in the system
 */
export async function getAllBikes(token: string): Promise<Bike[]> {
  const response = await fetch(`${API_BASE_URL}/api/bikes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to fetch bikes");
    throw new Error(errorText || "Failed to fetch bikes");
  }

  const data: Bike[] = await response.json();
  return data;
}

