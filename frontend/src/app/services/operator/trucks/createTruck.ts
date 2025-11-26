import { API_BASE_URL } from "../../utils/constants";
import { Truck, CreateTruckRequest } from "@/types/Truck";

export async function createTruck(
  request: CreateTruckRequest,
  token: string
): Promise<Truck> {
  const response = await fetch(`${API_BASE_URL}/api/trucks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to create truck");
    throw new Error(errorText || "Failed to create truck");
  }

  const data: Truck = await response.json();
  return data;
}

