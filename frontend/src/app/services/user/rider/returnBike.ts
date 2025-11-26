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
    let errorMessage = "Failed to return bike";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        errorMessage = data.message || data || errorMessage;
      } else {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
}

