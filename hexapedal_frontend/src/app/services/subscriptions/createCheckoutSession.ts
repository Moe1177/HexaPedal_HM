import { API_BASE_URL } from "../utils/constants";
import {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  PlanType,
} from "@/types/Billing";

/**
 * Creates a Stripe checkout session and returns the checkout URL
 */
export async function createCheckoutSession(
  planType: PlanType,
  token: string
): Promise<string> {
  const request: CheckoutSessionRequest = {
    planType,
    successUrl: `${window.location.origin}/dashboard/rider/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/dashboard/rider`,
  };

  const response = await fetch(
    `${API_BASE_URL}/api/subscriptions/create-checkout-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to create checkout session");
    throw new Error(errorText || "Failed to create checkout session");
  }

  const data: CheckoutSessionResponse = await response.json();
  return data.checkoutUrl;
}
