import { API_BASE_URL } from "../../utils/constants";

export async function returnBike(
  bikeId: number,
  userId: number,
  stationId: number,
  token?: string | null
): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/trips/return?bikeId=${bikeId}&userId=${userId}&stationId=${stationId}`,
    {
      method: "POST",
      headers,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Failed to return bike");
    throw new Error(errorText || "Failed to return bike");
  }
}

