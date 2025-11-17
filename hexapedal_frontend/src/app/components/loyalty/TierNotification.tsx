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

  const isUpgrade = loyaltyStatus.upgraded;
  const isDowngrade = loyaltyStatus.downgraded;
  const isTierChange = isUpgrade || isDowngrade;
  
  // Use longer duration for progress notifications (15s vs 10s for tier changes)
  const autoDismissDuration = isTierChange ? 10000 : 15000;

  useEffect(() => {
    // Show notification with a slight delay for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-dismiss
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, autoDismissDuration);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoDismissTimer);
    };
  }, [autoDismissDuration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const currentTierName = getTierName(loyaltyStatus.currentTier);
  const previousTierName = loyaltyStatus.previousTier ? getTierName(loyaltyStatus.previousTier) : "";
  const tierGradient = getTierColor(loyaltyStatus.currentTier);

  // Render tier change notification (upgrade/downgrade) - only when hasNotification is true
  if (isTierChange && loyaltyStatus.hasNotification) {
    return (
      <div
        className={`fixed top-4 right-4 z-[2000] max-w-md transition-all duration-300 ${
          isVisible && !isExiting
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4"
        }`}
      >
        <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border-2 overflow-hidden ${
          isUpgrade ? "border-emerald-500" : "border-amber-500"
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
                  : "bg-amber-100 dark:bg-amber-900/20"
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
              </div>

              {/* Message */}
              <div className="flex-1">
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {isUpgrade && "🎉 Tier Upgraded!"}
                  {isDowngrade && "Tier Updated"}
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
                className={`h-full bg-gradient-to-r ${tierGradient}`}
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
        `}</style>
      </div>
    );
  }

  // Render progress notification after completing a ride
  const nextTier = loyaltyStatus.progress?.nextTier;
  const nextTierName = loyaltyStatus.progress?.nextTierName || "Next Tier";
  const missingCriteria = loyaltyStatus.progress?.missingCriteria || [];
  
  // Filter to show only incomplete requirements
  const incompleteRequirements = missingCriteria.filter(c => !c.met);
  const completedRequirements = missingCriteria.filter(c => c.met);

  const getTierIcon = (tier: LoyaltyTier) => {
    switch (tier) {
      case LoyaltyTier.BRONZE:
        return "🥉";
      case LoyaltyTier.SILVER:
        return "🥈";
      case LoyaltyTier.GOLD:
        return "🥇";
      default:
        return "🚴";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[2000] max-w-lg transition-all duration-300 ${
        isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border-2 border-indigo-400 overflow-hidden">
        {/* Header Bar */}
        <div className={`h-2 bg-gradient-to-r ${tierGradient}`}></div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/20">
              <span className="text-2xl">{getTierIcon(loyaltyStatus.currentTier)}</span>
            </div>

            {/* Header Message */}
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-2">
                <span>🎉 One step closer!</span>
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {currentTierName} Tier • {loyaltyStatus.tripsLastYear} trips this year • {(loyaltyStatus.discountPercentage * 100).toFixed(0)}% discount
              </p>
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

          {/* Progress Section */}
          {nextTier ? (
            <>
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 mb-3">
                <h5 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                  To reach {nextTierName} Tier:
                </h5>
                
                {/* Show incomplete requirements prominently */}
                {incompleteRequirements.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {incompleteRequirements.map((criteria, index) => (
                      <div 
                        key={index}
                        className="text-xs p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 text-base">⚠️</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-amber-900 dark:text-amber-100 break-words">
                                {criteria.description}
                              </p>
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 flex-shrink-0">
                                {criteria.criteriaId}
                              </span>
                            </div>
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                              {criteria.progressDetail}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show completed requirements in collapsed form */}
                {completedRequirements.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                      ✓ {completedRequirements.length} requirement{completedRequirements.length > 1 ? 's' : ''} completed
                    </p>
                  </div>
                )}

                {/* Motivational message */}
                <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100">
                    {incompleteRequirements.length === 0 ? (
                      <>🎉 All requirements met! Your tier will be updated soon.</>
                    ) : incompleteRequirements.length === 1 ? (
                      <>Keep riding! Complete the requirement above to unlock {nextTierName} tier.</>
                    ) : (
                      <>Keep riding! Complete {incompleteRequirements.length} more requirements to unlock {nextTierName} tier.</>
                    )}
                  </p>
                </div>
              </div>
            </>
          ) : (
            // Maximum tier reached
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-3 rounded-lg border border-yellow-300 dark:border-yellow-800">
                <p className="text-xs font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <span className="text-base">🏆</span>
                  <span>You've reached the maximum tier! Keep riding to maintain your Gold status.</span>
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar (auto-dismiss indicator) */}
          <div className="mt-3 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${tierGradient}`}
              style={{ animation: `shrinkWidth ${autoDismissDuration / 1000}s linear forwards` }}
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
      `}</style>
    </div>
  );
}
