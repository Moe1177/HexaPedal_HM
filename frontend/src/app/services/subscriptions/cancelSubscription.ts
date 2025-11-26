import { API_BASE_URL } from "../utils/constants";
import { Subscription } from "@/types/Billing";

// Cancels the user's current active subscription
export async function cancelSubscription(token: string): Promise<Subscription> {
  const response = await fetch(`${API_BASE_URL}/api/subscriptions/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to cancel subscription");
    throw new Error(errorText || "Failed to cancel subscription");
  }

  const data: Subscription = await response.json();
  return data;
}
