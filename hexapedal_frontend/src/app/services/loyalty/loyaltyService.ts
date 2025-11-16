import { API_BASE_URL } from "../utils/constants";
import { LoyaltyStatus } from "@/types/Loyalty";

/**
 * Fetches the rider's current loyalty status
 */
export async function getLoyaltyStatus(token: string): Promise<LoyaltyStatus> {
  const response = await fetch(`${API_BASE_URL}/api/loyalty/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to fetch loyalty status");
    throw new Error(errorText || "Failed to fetch loyalty status");
  }

  const data: LoyaltyStatus = await response.json();
  return data;
}

/**
 * Manually evaluates/refreshes the rider's tier based on current stats
 */
export async function evaluateTier(token: string): Promise<LoyaltyStatus> {
  const response = await fetch(`${API_BASE_URL}/api/loyalty/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to evaluate tier");
    throw new Error(errorText || "Failed to evaluate tier");
  }

  const data: LoyaltyStatus = await response.json();
  return data;
}

/**
 * Dismisses a tier change notification
 */
export async function dismissNotification(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/loyalty/notification/dismiss`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to dismiss notification");
    throw new Error(errorText || "Failed to dismiss notification");
  }
}

