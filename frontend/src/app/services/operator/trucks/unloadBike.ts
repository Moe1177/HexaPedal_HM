import { API_BASE_URL } from "../../utils/constants";
import { Truck } from "@/types/Truck";

// Unloads a bike from a truck to a station
export async function unloadBikeFromTruck(
  truckId: number,
  bikeId: number,
  stationId: number,
  token: string
): Promise<Truck> {
  const response = await fetch(
    `${API_BASE_URL}/api/trucks/${truckId}/unload/${bikeId}/station/${stationId}`,
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
      .catch(() => "Failed to unload bike from truck");
    throw new Error(errorText || "Failed to unload bike from truck");
  }

  const data: Truck = await response.json();
  return data;
}

