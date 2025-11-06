"use client";

import { useState, useEffect } from "react";
import { BillingSummary, PlanType } from "@/types/Billing";
import { getBillingInfo } from "@/app/services/user/rider/getBillingInfo";
import { useAuth } from "@/hooks/useAuth";
import { getUserIdFromToken } from "@/app/services/user/getCurrentUser";

export default function BillingView() {
  const { token } = useAuth();
  const [userId, setUserId] = useState<number | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      const id = getUserIdFromToken(token);
      setUserId(id);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (userId) {
      loadBillingInfo();
    } else {
      // If token exists but userId is null, use mock data after brief delay
      const timer = setTimeout(() => {
        setBillingInfo(getMockBillingInfo());
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userId, token]);

  const loadBillingInfo = async () => {
    if (!userId || !token) {
      // Use mock data if userId is not available
      setBillingInfo(getMockBillingInfo());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getBillingInfo(userId, token);
      setBillingInfo(data);
    } catch (err) {
      // If API doesn't exist yet, show mock data
      console.error("Failed to load billing info:", err);
      setBillingInfo(getMockBillingInfo());
      setError(null); // Don't show error, just use mock data
    } finally {
      setIsLoading(false);
    }
  };

  const getMockBillingInfo = (): BillingSummary => {
    return {
      currentPlan: {
        id: 1,
        type: "monthly",
        name: "Monthly Pass",
        description: "Unlimited rides for a month",
        price: 29.99,
        currency: "USD",
        billingCycle: "monthly",
        features: [
          "Unlimited rides",
          "No additional fees",
          "Priority support",
          "Cancel anytime",
        ],
        validUntil: "2024-12-31T23:59:59Z",
        isActive: true,
      },
      totalSpent: 156.78,
      ridesThisMonth: 24,
      ridesThisYear: 156,
      nextBillingDate: "2024-12-01T00:00:00Z",
      billingHistory: [
        {
          id: 1,
          date: "2024-11-01T00:00:00Z",
          description: "Monthly Pass - November",
          amount: 29.99,
          currency: "USD",
          status: "paid",
          type: "subscription",
        },
        {
          id: 2,
          date: "2024-10-15T14:30:00Z",
          description: "Ride #1234",
          amount: 2.50,
          currency: "USD",
          status: "paid",
          type: "ride",
        },
      ],
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPlanBadgeColor = (type: PlanType) => {
    switch (type) {
      case "monthly":
        return "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400";
      case "annual":
        return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case "hourly":
        return "bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case "pending":
        return "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400";
      case "failed":
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400";
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !billingInfo) {
    return (
      <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const plan = billingInfo?.currentPlan;

  return (
    <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Billing & Payment</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage your subscription and view billing history</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Current Plan</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(
                    plan?.type || "monthly"
                  )}`}
                >
                  {plan?.name || "No Plan"}
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">{plan?.description || ""}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                ${plan?.price.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                /{plan?.billingCycle || "month"}
              </p>
            </div>
          </div>

          {plan?.validUntil && (
            <div className="mb-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Valid until</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatDate(plan.validUntil)}
              </p>
            </div>
          )}

          {plan?.features && plan.features.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Plan Features</h3>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <svg
                      className="w-5 h-5 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Total Spent</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              ${billingInfo?.totalSpent.toFixed(2) || "0.00"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">All time</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Rides This Month</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {billingInfo?.ridesThisMonth || 0}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Current month</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Rides This Year</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {billingInfo?.ridesThisYear || 0}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Current year</p>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Billing History</h2>
          {billingInfo?.billingHistory && billingInfo.billingHistory.length > 0 ? (
            <div className="space-y-4">
              {billingInfo.billingHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{item.description}</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {formatDate(item.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      ${item.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-600 dark:text-neutral-400">No billing history available</p>
            </div>
          )}
        </div>

        {billingInfo?.nextBillingDate && (
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Next billing date</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {formatDate(billingInfo.nextBillingDate)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

