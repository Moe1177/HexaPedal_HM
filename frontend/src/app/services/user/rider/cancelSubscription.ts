import { API_BASE_URL } from "../../utils/constants";
import { Subscription } from "@/types/Billing";

export async function cancelSubscription(token?: string | null): Promise<Subscription> {
  if (!token) {
    throw new Error("Token is required");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE_URL}/api/subscriptions/cancel`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Failed to cancel subscription");
    throw new Error(errorText || "Failed to cancel subscription");
  }

  const data = await response.json();
  return data;
}

