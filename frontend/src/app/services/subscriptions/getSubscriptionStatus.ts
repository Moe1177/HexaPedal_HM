import { API_BASE_URL } from "../utils/constants";

/**
 * Checks if the user has an active subscription
 */
export async function getSubscriptionStatus(token: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/subscriptions/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch subscription status");
  }

  const data: { hasActiveSubscription: boolean } = await response.json();
  return data.hasActiveSubscription;
}
