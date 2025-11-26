import { API_BASE_URL } from "../../utils/constants";

export interface FlexDollarsBalance {
  balance: number;
}

// Gets the rider's flex dollars balance
export async function getFlexDollars(token: string): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/api/flex-dollars/balance`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to fetch flex dollars balance");
    throw new Error(errorText || "Failed to fetch flex dollars balance");
  }

  const data: FlexDollarsBalance = await response.json();
  return data.balance;
}

