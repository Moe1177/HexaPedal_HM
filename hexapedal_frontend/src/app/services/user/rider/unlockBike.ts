import { API_BASE_URL } from "../../utils/constants";

export async function unlockBike(bikeId: number, userId: number, token?: string | null): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/trips/${bikeId}/start?userId=${userId}`,
    {
      method: "POST",
      headers,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Failed to unlock bike");
    throw new Error(errorText || "Failed to unlock bike");
  }
}

