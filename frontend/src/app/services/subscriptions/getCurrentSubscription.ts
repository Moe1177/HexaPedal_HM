import { API_BASE_URL } from "../utils/constants";
import { Subscription } from "@/types/Billing";

/**
 * Fetches the current active subscription for the authenticated user
 */
export async function getCurrentSubscription(
  token: string
): Promise<Subscription | null> {
  const response = await fetch(`${API_BASE_URL}/api/subscriptions/current`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();

  if (!response.ok) {
  
    if (text.includes("Only riders") || text.includes("subscription")) {
     
      return null;
    }
    throw new Error("Failed to fetch current subscription");
  }

  if (text.includes("No active subscription")) {
    return null;
  }


  try {
    const data: Subscription = JSON.parse(text);
    return data;
  } catch (error) {
 
    return null;
  }
}
