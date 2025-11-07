import { API_BASE_URL } from "../../utils/constants";
import { BillingSummary } from "@/types/Billing";

export async function getBillingInfo(userId: number, token?: string | null): Promise<BillingSummary> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/billing`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Failed to fetch billing information");
    throw new Error(errorText || "Failed to fetch billing information");
  }

  const data = await response.json();
  return data;
}

