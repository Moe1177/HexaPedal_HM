import { API_BASE_URL } from "../../utils/constants";
import { Trip } from "@/types/Trip";

export async function getRides(userId: number, token?: string | null): Promise<Trip[]> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/trips?userId=${userId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Failed to fetch rides");
    throw new Error(errorText || "Failed to fetch rides");
  }

  const data = await response.json();
  return data;
}

