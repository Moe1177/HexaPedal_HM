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
    let errorMessage = "Failed to fetch loyalty status";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage;
      } else {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
    } catch (e) {

      errorMessage = response.statusText || errorMessage;
      if (response.status === 401) {
        errorMessage = "Authentication failed, please log in again. Token may be expired or invalid.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to access loyalty status.";
      }
    }
    throw new Error(errorMessage);
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
    let errorMessage = "Failed to evaluate tier";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage;
      } else {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
      if (response.status === 401) {
        errorMessage = "Authentication failed, please log in again. Token may be expired or invalid.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to evaluate tier.";
      }
    }
    throw new Error(errorMessage);
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
    let errorMessage = "Failed to dismiss notification";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage;
      } else {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
      if (response.status === 401) {
        errorMessage = "Authentication failed, please log in again. Token may be expired or invalid.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to dismiss notifications.";
      }
    }
    throw new Error(errorMessage);
  }
}

