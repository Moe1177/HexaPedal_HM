import { API_BASE_URL } from "../../utils/constants";
import { Truck } from "@/types/Truck";

export async function loadBikeOntoTruck(
  truckId: number,
  bikeId: number,
  token: string
): Promise<Truck> {
  const response = await fetch(
    `${API_BASE_URL}/api/trucks/${truckId}/load/${bikeId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to load bike onto truck");
    throw new Error(errorText || "Failed to load bike onto truck");
  }

  const data: Truck = await response.json();
  return data;
}

