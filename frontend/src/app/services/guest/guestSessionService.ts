import { API_BASE_URL } from "../utils/constants";

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface GuestSessionResponse {
  userId: number;
  token: string;
  expiresIn: number;
  guestEmail: string;
}

export interface ConversionResponse {
  userId: number;
  token: string;
  expiresIn: number;
  email: string;
  message: string;
}

export async function initializeGuestSession(
  paymentMethodId: string,
  billingAddress: BillingAddress,
  cardholderName: string
): Promise<GuestSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/guest/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodId,
      billingAddress,
      cardholderName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to initialize guest session");
  }

  const data = await response.json();

  // Store guest token in sessionStorage
  sessionStorage.setItem("guest_token", data.token);
  sessionStorage.setItem("guest_user_id", data.userId.toString());

  return data;
}

export async function convertGuestAccount(
  fullName: string,
  email: string,
  username: string,
  password: string,
  guestToken: string
): Promise<ConversionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/guest/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${guestToken}`,
    },
    body: JSON.stringify({
      fullName,
      email,
      username,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to convert guest account");
  }

  const data = await response.json();

  // Clear guest token from session storage
  clearGuestSession();

  // Only store the new token if it exists (it will be null if email verification is required)
  if (data.token) {
    localStorage.setItem("auth_token", data.token);
  }

  return data;
}

export async function deleteGuestAccount(guestToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/guest/account`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${guestToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to delete guest account");
  }

  clearGuestSession();
}

export function getGuestToken(): string | null {
  return sessionStorage.getItem("guest_token");
}

export function getGuestUserId(): number | null {
  const userId = sessionStorage.getItem("guest_user_id");
  return userId ? parseInt(userId, 10) : null;
}

export function isGuestUser(): boolean {
  return getGuestToken() !== null;
}

export function clearGuestSession(): void {
  sessionStorage.removeItem("guest_token");
  sessionStorage.removeItem("guest_user_id");
}

export async function startGuestTrip(
  bikeId: number,
  guestToken: string,
  destinationData?: {
    stationName: string;
    stationId: number;
    latitude: number;
    longitude: number;
  } | null
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/guest/trips/${bikeId}/start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${guestToken}`,
      },
      body: destinationData ? JSON.stringify(destinationData) : undefined,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to start guest trip");
  }
}
