"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Subscription } from "@/types/Billing";
import { getCurrentSubscription } from "@/app/services/subscriptions/getCurrentSubscription";
import { useAuth } from "@/hooks/useAuth";

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams?.get("session_id");

  useEffect(() => {
    if (!token) {
      router.push("/dashboard/login");
      return;
    }

    loadSubscription();
  }, [token, router]);

  const loadSubscription = async () => {
    if (!token) return;

    try {
      const sub = await getCurrentSubscription(token);
      setSubscription(sub);
    } catch (err) {
      console.error("Failed to load subscription:", err);
      setError("Failed to load subscription details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-700 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Subscription Not Found
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {error ||
              "We couldn't find your subscription. Please try again or contact support."}
          </p>
          <Link
            href="/dashboard/rider"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-xl hover:from-indigo-700 hover:to-sky-700 transition-all font-semibold shadow-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-neutral-800 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
            <svg
              className="w-10 h-10 text-white"
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
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Subscription Activated!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Your payment was successful and your subscription is now active
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-900/20 dark:to-sky-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {subscription.planName}
            </h2>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
              {subscription.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Price
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                ${subscription.planPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Plan Type
              </p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {subscription.planType === "MONTHLY"
                  ? "Monthly"
                  : subscription.planType === "YEARLY"
                  ? "Yearly"
                  : "Pay Per Trip"}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  Start Date
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDate(subscription.currentPeriodStart)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  Renewal Date
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {sessionId && (
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 mb-6">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              Transaction ID
            </p>
            <p className="text-xs font-mono text-neutral-900 dark:text-neutral-100 break-all">
              {sessionId}
            </p>
          </div>
        )}

        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                What's next?
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                You can now enjoy unlimited rides based on your subscription
                plan. Visit the map to find available bikes near you.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/dashboard/rider"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-xl hover:from-indigo-700 hover:to-sky-700 transition-all font-semibold text-center shadow-lg"
          >
            Go to Map
          </Link>
          <Link
            href="/dashboard/rider"
            className="flex-1 px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all font-semibold text-center"
          >
            View Billing
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
