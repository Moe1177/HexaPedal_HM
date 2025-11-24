import { API_BASE_URL } from "../../utils/constants";
import { BillingSummary, BillingHistory } from "@/types/Billing";

/**
 * Backend BillingHistoryDto structure
 */
interface BillingHistoryDto {
  rideId: number;
  startDateTime: string;
  bikeId: number | null;
  originStation: string;
  arrivalStation: string;
  distance: number;
  duration: number;
  cost: number; // This is already the final cost after flex dollars
  flexDollarsUsed: number;
}

export async function getBillingInfo(token?: string | null): Promise<BillingSummary> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/billing/history`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Failed to fetch billing information");
    throw new Error(errorText || "Failed to fetch billing information");
  }

  const rides: BillingHistoryDto[] = await response.json();

  // Transform the rides array into BillingSummary format
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Calculate total spent
  const totalSpent = rides.reduce((sum, ride) => sum + (ride.cost || 0), 0);

  // Count rides this month
  const ridesThisMonth = rides.filter((ride) => {
    const rideDate = new Date(ride.startDateTime);
    return rideDate.getMonth() === currentMonth && rideDate.getFullYear() === currentYear;
  }).length;

  // Count rides this year
  const ridesThisYear = rides.filter((ride) => {
    const rideDate = new Date(ride.startDateTime);
    return rideDate.getFullYear() === currentYear;
  }).length;

  // Map rides to billing history format
  // The cost from backend is already the final cost after flex dollars are applied
  const billingHistory: BillingHistory[] = rides.map((ride, index) => ({
    id: ride.rideId || index + 1,
    date: ride.startDateTime,
    description: `Ride #${ride.rideId}${ride.originStation ? ` from ${ride.originStation}` : ""}${ride.arrivalStation ? ` to ${ride.arrivalStation}` : ""}${ride.flexDollarsUsed > 0 ? ` (${ride.flexDollarsUsed} flex dollars used)` : ""}`,
    amount: ride.cost || 0, // Already the final cost after flex dollars
    currency: "CAD",
    status: "paid" as const,
    type: "ride" as const,
  }));

  return {
    currentPlan: null, // Will be set from subscription data
    totalSpent,
    ridesThisMonth,
    ridesThisYear,
    nextBillingDate: null,
    billingHistory,
  };
}

