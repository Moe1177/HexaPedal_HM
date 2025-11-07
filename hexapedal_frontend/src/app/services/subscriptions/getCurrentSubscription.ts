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

  if (!response.ok) {
    // If 200 OK but body says "No active subscription", return null
    const text = await response.text();
    if (text.includes("No active subscription")) {
      return null;
    }
    throw new Error("Failed to fetch current subscription");
  }

  const text = await response.text();

  // Handle "No active subscription" response
  if (text.includes("No active subscription")) {
    return null;
  }

  // Parse JSON response
  try {
    const data: Subscription = JSON.parse(text);
    return data;
  } catch (error) {
    return null;
  }
}
