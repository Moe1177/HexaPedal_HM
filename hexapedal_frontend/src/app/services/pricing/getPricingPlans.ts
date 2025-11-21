import { API_BASE_URL } from "../utils/constants";
import { PricingPlan } from "@/types/Billing";

/**
 * Fetches all active pricing plans from the backend
 */
export async function getPricingPlans(): Promise<PricingPlan[]> {
  const response = await fetch(`${API_BASE_URL}/api/pricing/plans`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to fetch pricing plans");
    throw new Error(errorText || "Failed to fetch pricing plans");
  }

  const data = await response.json();
  return data;
}
