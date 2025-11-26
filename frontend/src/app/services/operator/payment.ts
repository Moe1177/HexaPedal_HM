import { API_BASE_URL } from "../utils/constants";

export interface PaymentMethodResponse {
  id: number;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AddPaymentMethodRequest {
  paymentMethodId: string;
  cardholderName: string;
  billingAddress: BillingAddress;
}

// Get the current user's payment method
export async function getPaymentMethod(): Promise<PaymentMethodResponse | null> {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/api/payments/methods`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; 
    }
    throw new Error("Failed to fetch payment method");
  }

  return await response.json();
}

// Add a new payment method for the current user
export async function addPaymentMethod(
  paymentMethodId: string,
  cardholderName: string,
  billingAddress: BillingAddress
): Promise<PaymentMethodResponse> {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    throw new Error("Not authenticated");
  }

  const payload: AddPaymentMethodRequest = {
    paymentMethodId,
    cardholderName,
    billingAddress,
  };

  const response = await fetch(`${API_BASE_URL}/api/payments/methods/stripe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to add payment method");
  }

  return await response.json();
}

