export type PlanType = "pay-per-ride" | "hourly" | "monthly" | "annual";

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
  currentPlan: UserPlan;
  totalSpent: number;
  ridesThisMonth: number;
  ridesThisYear: number;
  nextBillingDate: string | null;
  billingHistory: BillingHistory[];
}

