import { API_BASE_URL } from "../../utils/constants";
import { Subscription } from "@/types/Billing";

export async function getCurrentSubscription(token?: string | null): Promise<Subscription | null> {
  if (!token) {
    return null;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE_URL}/api/subscriptions/current`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    if (response.status === 404 || response.status === 200) {
      // No active subscription
      return null;
    }
    const errorText = await response.text().catch(() => "Failed to fetch subscription");
    throw new Error(errorText || "Failed to fetch subscription");
  }

  const data = await response.json();
  
  // Handle case where backend returns "No active subscription" as string
  if (typeof data === "string") {
    return null;
  }

  return data;
}

