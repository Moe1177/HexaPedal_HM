"use client";

import { useEffect, useState } from "react";
import { LoyaltyStatus, LoyaltyTier, getTierName, getTierColor } from "@/types/Loyalty";

interface TierNotificationProps {
  loyaltyStatus: LoyaltyStatus;
  onDismiss: () => void;
}

export default function TierNotification({ loyaltyStatus, onDismiss }: TierNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show notification with a slight delay for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-dismiss after 10 seconds
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoDismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  if (!loyaltyStatus.hasNotification) {
    return null;
  }

  const isUpgrade = loyaltyStatus.upgraded;
  const isDowngrade = loyaltyStatus.downgraded;
  const currentTierName = getTierName(loyaltyStatus.currentTier);
  const previousTierName = loyaltyStatus.previousTier ? getTierName(loyaltyStatus.previousTier) : "";
  const tierGradient = getTierColor(loyaltyStatus.currentTier);

  return (
    <div
      className={`fixed top-4 right-4 z-[2000] max-w-md transition-all duration-300 ${
        isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      }`}
    >
      <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border-2 overflow-hidden ${
        isUpgrade ? "border-emerald-500" : isDowngrade ? "border-amber-500" : "border-blue-500"
      }`}>
        {/* Header Bar */}
        <div className={`h-2 bg-gradient-to-r ${tierGradient}`}></div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isUpgrade 
                ? "bg-emerald-100 dark:bg-emerald-900/20" 
                : isDowngrade 
                ? "bg-amber-100 dark:bg-amber-900/20" 
                : "bg-blue-100 dark:bg-blue-900/20"
            }`}>
              {isUpgrade && (
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              {isDowngrade && (
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
              {!isUpgrade && !isDowngrade && (
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Message */}
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                {isUpgrade && "🎉 Tier Upgraded!"}
                {isDowngrade && "Tier Updated"}
                {!isUpgrade && !isDowngrade && "Tier Status Changed"}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {isUpgrade && (
                  <>
                    Congratulations! You've been upgraded from{" "}
                    <span className="font-semibold">{previousTierName}</span> to{" "}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {currentTierName}
                    </span>{" "}
                    tier!
                  </>
                )}
                {isDowngrade && (
                  <>
                    Your tier has changed from{" "}
                    <span className="font-semibold">{previousTierName}</span> to{" "}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {currentTierName}
                    </span>.
                  </>
                )}
                {!isUpgrade && !isDowngrade && (
                  <>Your loyalty tier status has been updated.</>
                )}
              </p>
              {isUpgrade && (
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                  You now get {(loyaltyStatus.discountPercentage * 100).toFixed(0)}% off all rides!
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar (auto-dismiss indicator) */}
          <div className="mt-3 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${tierGradient} animate-shrink-width`}
              style={{ animation: "shrinkWidth 10s linear forwards" }}
            ></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-shrink-width {
          animation: shrinkWidth 10s linear forwards;
        }
      `}</style>
    </div>
  );
}

