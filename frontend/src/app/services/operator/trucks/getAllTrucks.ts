import { API_BASE_URL } from "../../utils/constants";
import { Truck } from "@/types/Truck";

export async function getAllTrucks(token: string): Promise<Truck[]> {
  const response = await fetch(`${API_BASE_URL}/api/trucks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to fetch trucks");
    throw new Error(errorText || "Failed to fetch trucks");
  }

  const data: Truck[] = await response.json();
  return data;
}

