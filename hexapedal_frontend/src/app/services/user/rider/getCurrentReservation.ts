import { API_BASE_URL } from "../../utils/constants";

export interface ReservationStatus {
  hasReservation: boolean;
  bikeId: number | null;
  bikeType: string | null;
  stationName: string | null;
  expiresAt: string | null;
}

export async function getCurrentReservation(
  token: string
): Promise<ReservationStatus> {
  const response = await fetch(`${API_BASE_URL}/api/reservations/current`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current reservation");
  }

  return await response.json();
}
