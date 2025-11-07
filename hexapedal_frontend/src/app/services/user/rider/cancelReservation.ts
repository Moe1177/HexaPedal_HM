import { API_BASE_URL } from "../../utils/constants";

export async function cancelReservation(bikeId: number, email: string, token?: string | null): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/reservations/${bikeId}/cancel?email=${encodeURIComponent(email)}`,
    {
      method: "POST",
      headers,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Failed to cancel reservation");
    throw new Error(errorText || "Failed to cancel reservation");
  }
}

