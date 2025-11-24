import { API_BASE_URL } from "../../utils/constants";
import { Bike } from "@/types/Bike";

/**
 * Creates a new bike and docks it at a specific station/dock
 */
export async function createBike(
  type: string,
  stationId: number,
  dockId: number,
  token: string
): Promise<Bike> {
  // Step 1: Create the bike
  const createResponse = await fetch(`${API_BASE_URL}/api/bikes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse
      .text()
      .catch(() => "Failed to create bike");
    throw new Error(errorText || "Failed to create bike");
  }

  const bike: Bike = await createResponse.json();

  // Step 2: Dock the bike at the specified station/dock
  const dockResponse = await fetch(
    `${API_BASE_URL}/api/docks/${stationId}/${dockId}/bike/${bike.id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!dockResponse.ok) {
    const errorText = await dockResponse
      .text()
      .catch(() => "Failed to dock bike at station");
    throw new Error(errorText || "Failed to dock bike at station");
  }

  return bike;
}

