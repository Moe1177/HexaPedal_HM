"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PricingPlan } from "@/types/Billing";
import { getPricingPlans } from "@/app/services/pricing/getPricingPlans";
import { createCheckoutSession } from "@/app/services/subscriptions/createCheckoutSession";
import { useAuth } from "@/hooks/useAuth";

export default function LandingPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      const plans = await getPricingPlans();
      setPricingPlans(plans);
    } catch (error) {
      console.error("Failed to load pricing plans:", error);
      // Set default plans on error
      setPricingPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = async (planId: number) => {
    const plan = pricingPlans.find((p) => p.id === planId);
    if (!plan) return;

    // Check if user is authenticated
    if (!token) {
      // Redirect to signup
      router.push("/dashboard/signup");
      return;
    }

    // Create checkout session and redirect to Stripe
    setCheckoutLoading(planId);
    try {
      const checkoutUrl = await createCheckoutSession(plan.planType, token);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert("Failed to start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  };

  const getPlanFeatures = (planType: string): string[] => {
    switch (planType) {
      case "PAY_PER_TRIP":
        return [
          "$0.50 base + $0.01/minute",
          "Access all stations",
          "No commitment",
        ];
      case "MONTHLY":
        return [
          "Unlimited rides",
          "Priority access",
          "24/7 customer support",
          "Cancel anytime",
        ];
      case "YEARLY":
        return [
          "Unlimited rides",
          "All monthly benefits",
          "Best value",
          "Special member events",
        ];
      default:
        return [];
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case "PAY_PER_TRIP":
        return (
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
        );
      case "MONTHLY":
        return (
          <svg
            className="w-6 h-6 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case "YEARLY":
        return (
          <svg
            className="w-6 h-6 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getIconBgColor = (planType: string) => {
    switch (planType) {
      case "PAY_PER_TRIP":
        return "bg-blue-100 dark:bg-blue-900";
      case "MONTHLY":
        return "bg-green-100 dark:bg-green-900";
      case "YEARLY":
        return "bg-purple-100 dark:bg-purple-900";
      default:
        return "bg-neutral-100 dark:bg-neutral-800";
    }
  };

  const formatPrice = (plan: PricingPlan) => {
    if (plan.planType === "PAY_PER_TRIP") {
      return {
        main: "$0.50",
        sub: "+ $0.01/min",
      };
    } else if (plan.planType === "MONTHLY") {
      return {
        main: `$${plan.price.toFixed(2)}`,
        sub: "/month",
      };
    } else if (plan.planType === "YEARLY") {
      const monthlySavings = 12 * 12 - plan.price;
      return {
        main: `$${plan.price.toFixed(2)}`,
        sub: "/year",
        savings:
          monthlySavings > 0
            ? `Save $${monthlySavings.toFixed(0)} (${Math.round(
                (monthlySavings / (12 * 12)) * 100
              )}% off)`
            : undefined,
      };
    }
    return {
      main: `$${plan.price.toFixed(2)}`,
      sub: "",
    };
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <nav className="container mx-auto px-6 py-6 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 2L22 7L22 17L12 22L2 17L2 7L12 2Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              HexaPedal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/login"
              className="px-5 py-2.5 text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-sm"
            >
              Log In
            </Link>
            <Link
              href="/dashboard/signup"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-xl hover:from-indigo-600 hover:to-sky-600 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent leading-tight tracking-tight">
            Ride Smart, Ride Green
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-8 font-light">
            Affordable bike sharing passes for your daily commute and adventures
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : pricingPlans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-600 dark:text-neutral-400">
              No pricing plans available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => {
              const priceInfo = formatPrice(plan);
              const features = getPlanFeatures(plan.planType);
              const isPopular = plan.planType === "MONTHLY";

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl shadow-lg p-8 border transition-all hover:-translate-y-1 ${
                    isPopular
                      ? "bg-gradient-to-br from-white to-sky-50 dark:from-neutral-900 dark:to-neutral-800 border-2 border-indigo-500 dark:border-indigo-400 hover:shadow-indigo-500/20 relative"
                      : "bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-800"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-5 py-1.5 rounded-bl-2xl rounded-tr-3xl text-xs font-bold tracking-wide">
                      Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <div
                      className={`w-12 h-12 ${getIconBgColor(
                        plan.planType
                      )} rounded-lg flex items-center justify-center mb-4`}
                    >
                      {getPlanIcon(plan.planType)}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {plan.description}
                    </p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{priceInfo.main}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {priceInfo.sub}
                    </span>
                    {priceInfo.savings && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {priceInfo.savings}
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleGetStarted(plan.id)}
                    disabled={checkoutLoading === plan.id}
                    className={`block w-full py-3.5 text-white rounded-xl transition-all font-semibold text-center ${
                      isPopular
                        ? "bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40"
                        : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                    } ${
                      checkoutLoading === plan.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {checkoutLoading === plan.id ? "Loading..." : "Get Started"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t border-gray-200 dark:border-slate-700 mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 2L22 7L22 17L12 22L2 17L2 7L12 2Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold">HexaPedal</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              © 2024 HexaPedal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
