import { API_BASE_URL } from "../utils/constants";

export async function getUserIdFromBike(bikeId: number, token?: string | null): Promise<number | null> {
  if (!token) return null;

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Fetch all bikes and find the one with the matching bikeId
    const response = await fetch(`${API_BASE_URL}/api/bikes`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const bikes = await response.json();
      const bike = bikes.find((b: any) => b.id === bikeId);
      
      if (bike && bike.currentUserId) {
        return bike.currentUserId;
      }
    }
  } catch (error) {
    console.error("Failed to get user ID from bike:", error);
  }

  return null;
}

