export type PlanType = "MONTHLY" | "YEARLY" | "PAY_PER_TRIP";

export interface UserPlan {
  id: number;
  type: PlanType;
  name: string;
  description: string;
  price: number; // in USD
  currency: string;
  billingCycle: "one-time" | "hourly" | "monthly" | "annual";
  features: string[];
  validUntil: string | null;
  isActive: boolean;
}

export interface BillingHistory {
  id: number;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  type: "ride" | "subscription" | "refund";
}

export interface BillingSummary {
  currentPlan: UserPlan | null;
  totalSpent: number;
  ridesThisMonth: number;
  ridesThisYear: number;
  nextBillingDate: string | null;
  billingHistory: BillingHistory[];
}

export interface PricingPlan {
  id: number;
  planType: PlanType;
  name: string;
  price: number;
  description: string;
  ratePerMinute: number;
}

export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";

export interface Subscription {
  id: number;
  planType: PlanType;
  planName: string;
  planPrice: number;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSessionRequest {
  planType: PlanType;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  message: string;
}
