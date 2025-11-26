import { API_BASE_URL } from "../../utils/constants";

export async function expireReservations(token?: string | null): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/reservations/expire`,
    {
      method: "POST",
      headers,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Failed to expire reservations");
    throw new Error(errorText || "Failed to expire reservations");
  }
}

