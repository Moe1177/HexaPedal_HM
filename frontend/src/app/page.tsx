"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PricingPlan } from "@/types/Billing";
import { getPricingPlans } from "@/app/services/pricing/getPricingPlans";

export default function LandingPage() {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      const plans = await getPricingPlans();
      setPricingPlans(plans);
    } catch (error) {
      console.error("Failed to load pricing plans:", error);
      setPricingPlans([]);
    } finally {
      setIsLoading(false);
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

  const getBikeImage = (planType: string) => {
    switch (planType) {
      case "PAY_PER_TRIP":
        return (
          <svg
            className="w-full h-48"
            viewBox="0 0 200 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="90" r="25" stroke="#4F46E5" strokeWidth="4" fill="none"/>
            <circle cx="150" cy="90" r="25" stroke="#4F46E5" strokeWidth="4" fill="none"/>
            <path d="M50 90 L80 50 L90 50 L110 90" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M90 50 L120 30 L130 35" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M110 90 L150 90" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="95" cy="50" r="3" fill="#4F46E5"/>
            <text x="100" y="15" fill="#4F46E5" fontSize="12" fontWeight="bold">Standard Bike</text>
          </svg>
        );
      case "MONTHLY":
        return (
          <svg
            className="w-full h-48"
            viewBox="0 0 200 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="90" r="25" stroke="#10B981" strokeWidth="4" fill="none"/>
            <circle cx="150" cy="90" r="25" stroke="#10B981" strokeWidth="4" fill="none"/>
            <path d="M50 90 L80 50 L90 50 L110 90" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M90 50 L120 30 L130 35" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M110 90 L150 90" stroke="#10B981" strokeWidth="4" strokeLinecap="round"/>
            <rect x="75" y="55" width="20" height="12" fill="#10B981" rx="2"/>
            <circle cx="95" cy="50" r="3" fill="#10B981"/>
            <path d="M75 61 L70 61 L68 65" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
            <text x="90" y="15" fill="#10B981" fontSize="12" fontWeight="bold">Electric Bike</text>
          </svg>
        );
      case "YEARLY":
        return (
          <svg
            className="w-full h-48"
            viewBox="0 0 200 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="90" r="25" stroke="#8B5CF6" strokeWidth="4" fill="none"/>
            <circle cx="150" cy="90" r="25" stroke="#8B5CF6" strokeWidth="4" fill="none"/>
            <path d="M50 90 L80 50 L90 50 L110 90" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M90 50 L120 30 L130 35" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M110 90 L150 90" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round"/>
            <rect x="75" y="55" width="22" height="14" fill="#8B5CF6" rx="3"/>
            <circle cx="95" cy="50" r="3" fill="#8B5CF6"/>
            <path d="M75 62 L70 62 L68 66" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
            <path d="M84 60 L86 63 L83 63 L85 66" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <text x="75" y="15" fill="#8B5CF6" fontSize="12" fontWeight="bold">Premium Electric</text>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative overflow-hidden">
      {/* Falling Maple Leaves*/}
      <div className="absolute top-60 left-1/4 opacity-40 dark:opacity-25 pointer-events-none animate-[fall_15s_linear_infinite]">
        <svg width="45" height="45" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 30 L15 20 L12 24 L8 20 L11 15 L6 12 L12 10 L10 5 L16 9 L18 3 L20 12 L22 3 L24 9 L30 5 L28 10 L34 12 L29 15 L32 20 L28 24 L25 20 L20 30 Z" fill="#ef4444"/>
        </svg>
      </div>

      <div className="absolute top-40 left-[40%] opacity-35 dark:opacity-22 pointer-events-none animate-[fall_12s_linear_infinite_2s]">
        <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 30 L15 20 L12 24 L8 20 L11 15 L6 12 L12 10 L10 5 L16 9 L18 3 L20 12 L22 3 L24 9 L30 5 L28 10 L34 12 L29 15 L32 20 L28 24 L25 20 L20 30 Z" fill="#fbbf24"/>
        </svg>
      </div>

      <div className="absolute top-50 right-1/3 opacity-40 dark:opacity-25 pointer-events-none animate-[fall_20s_linear_infinite_3s]">
        <svg width="42" height="42" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 30 L15 20 L12 24 L8 20 L11 15 L6 12 L12 10 L10 5 L16 9 L18 3 L20 12 L22 3 L24 9 L30 5 L28 10 L34 12 L29 15 L32 20 L28 24 L25 20 L20 30 Z" fill="#f59e0b"/>
        </svg>
      </div>

      <div className="absolute top-35 left-[55%] opacity-35 dark:opacity-22 pointer-events-none animate-[fall_17s_linear_infinite_5s]">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 30 L15 20 L12 24 L8 20 L11 15 L6 12 L12 10 L10 5 L16 9 L18 3 L20 12 L22 3 L24 9 L30 5 L28 10 L34 12 L29 15 L32 20 L28 24 L25 20 L20 30 Z" fill="#dc2626"/>
        </svg>
      </div>

      <div className="absolute top-45 right-[40%] opacity-38 dark:opacity-24 pointer-events-none animate-[fall_14s_linear_infinite_7s]">
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 30 L15 20 L12 24 L8 20 L11 15 L6 12 L12 10 L10 5 L16 9 L18 3 L20 12 L22 3 L24 9 L30 5 L28 10 L34 12 L29 15 L32 20 L28 24 L25 20 L20 30 Z" fill="#ef4444"/>
        </svg>
      </div>

      <div className="absolute top-55 left-[60%] opacity-36 dark:opacity-23 pointer-events-none animate-[fall_19s_linear_infinite_4s]">
        <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 30 L15 20 L12 24 L8 20 L11 15 L6 12 L12 10 L10 5 L16 9 L18 3 L20 12 L22 3 L24 9 L30 5 L28 10 L34 12 L29 15 L32 20 L28 24 L25 20 L20 30 Z" fill="#fbbf24"/>
        </svg>
      </div>

      <nav className="container mx-auto px-6 py-6 border-b border-neutral-100 dark:border-neutral-800 relative z-10">
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
      <section className="container mx-auto px-6 py-20 md:py-32 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent leading-tight tracking-tight">
            Ride Smart, Ride Green
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-8 font-light">
            Choose from our fleet of standard and electric bikes for your daily commute and adventures
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
          <div className="flex justify-center items-center">
            <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto px-4">
              {pricingPlans.map((plan, index) => {
                const features = getPlanFeatures(plan.planType);
                const isPopular = plan.planType === "MONTHLY";

                return (
                  <div
                    key={plan.id ?? `plan-${index}`}
                    className={`rounded-3xl shadow-2xl p-10 border-2 transition-all hover:-translate-y-2 hover:shadow-3xl ${
                      isPopular
                        ? "bg-gradient-to-br from-white to-green-50 dark:from-neutral-900 dark:to-neutral-800 border-green-500 dark:border-green-400 relative"
                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-bl-2xl rounded-tr-3xl text-sm font-bold tracking-wide">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="mb-8">
                      {getBikeImage(plan.planType)}
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
                        {plan.name}
                      </h3>
                      <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>
                    
                    <ul className="space-y-4 mt-8">
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <svg
                            className="w-7 h-7 text-green-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-lg text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-gray-200 dark:border-slate-700 mt-24 relative z-10">
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
