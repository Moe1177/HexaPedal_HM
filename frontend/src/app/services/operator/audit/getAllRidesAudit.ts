import { API_BASE_URL } from "../../utils/constants";

export interface RideAudit {
  rideId: number;
  userId: number;
  userEmail: string;
  userName: string;
  userRole: "OPERATOR" | "RIDER";
  startDateTime: string;
  endDateTime: string;
  bikeId: number | null;
  bikeType: string | null;
  originStation: string;
  arrivalStation: string;
  distance: number;
  duration: number;
  cost: number;
}

export async function getAllRidesAudit(token: string): Promise<RideAudit[]> {
  const response = await fetch(`${API_BASE_URL}/api/ride-history/audit/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch audit log";
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
        errorMessage = "Authentication failed, please log in again.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to access the audit log.";
      }
    }
    throw new Error(errorMessage);
  }

  const data: RideAudit[] = await response.json();
  return data;
}

