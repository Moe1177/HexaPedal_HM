import { API_BASE_URL } from "../../utils/constants";

export async function cancelReservation(bikeId: number, email: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/reservations/${bikeId}/cancel?email=${encodeURIComponent(email)}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Failed to cancel reservation");
    throw new Error(errorText || "Failed to cancel reservation");
  }
}

