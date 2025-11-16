"use client";

import { LoyaltyStatus, LoyaltyTier, getTierName, getTierColor } from "@/types/Loyalty";

interface LoyaltyDetailModalProps {
  loyaltyStatus: LoyaltyStatus;
  onClose: () => void;
}

export default function LoyaltyDetailModal({ loyaltyStatus, onClose }: LoyaltyDetailModalProps) {
  const tier = loyaltyStatus.currentTier;
  const tierName = getTierName(tier);
  const tierGradient = getTierColor(tier);

  const getTierRequirements = (targetTier: LoyaltyTier): string => {
    switch (targetTier) {
      case LoyaltyTier.BRONZE:
        return "10 trips in the last year";
      case LoyaltyTier.SILVER:
        return "15 trips in the last year";
      case LoyaltyTier.GOLD:
        return "20 trips in the last year";
      default:
        return "No requirements";
    }
  };

  const getNextTierInfo = () => {
    if (tier === LoyaltyTier.GOLD) {
      return { name: "Maximum tier reached", requirements: "You're at the highest tier!", trips: 0 };
    }
    
    const tiers = [LoyaltyTier.NONE, LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD];
    const currentIndex = tiers.indexOf(tier);
    const nextTier = tiers[currentIndex + 1];
    
    const tripsNeeded: { [key: string]: number } = {
      [LoyaltyTier.BRONZE]: 10,
      [LoyaltyTier.SILVER]: 15,
      [LoyaltyTier.GOLD]: 20,
    };

    return {
      name: getTierName(nextTier),
      requirements: getTierRequirements(nextTier),
      trips: tripsNeeded[nextTier] - loyaltyStatus.tripsLastYear,
    };
  };

  const nextTier = getNextTierInfo();

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${tierGradient} p-6 text-white rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">
                {tier === LoyaltyTier.BRONZE && "🥉"}
                {tier === LoyaltyTier.SILVER && "🥈"}
                {tier === LoyaltyTier.GOLD && "🥇"}
                {tier === LoyaltyTier.NONE && "🚴"}
              </span>
              <div>
                <h2 className="text-2xl font-bold">
                  {tier === LoyaltyTier.NONE ? "Loyalty Program" : `${tierName} Tier`}
                </h2>
                <p className="text-white/90 text-sm">
                  Member since {new Date(loyaltyStatus.tierChangedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Your Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">Ride Discount</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {(loyaltyStatus.discountPercentage * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Off every ride
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">Reservation Time</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {loyaltyStatus.reservationHoldMinutes} min
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Hold time for bikes
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Your Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Trips</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {loyaltyStatus.totalTrips}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Last Year</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {loyaltyStatus.tripsLastYear}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Claimed Reservations</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {loyaltyStatus.successfulClaimedReservationsLastYear}
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Missed Reservations</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {loyaltyStatus.missedReservationsLastYear}
                </p>
              </div>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {tier !== LoyaltyTier.GOLD && (
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                Progress to {nextTier.name} Tier
              </h3>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600 dark:text-neutral-400">Current Progress</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {loyaltyStatus.tripsLastYear} trips
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (loyaltyStatus.tripsLastYear / (loyaltyStatus.tripsLastYear + Math.max(0, nextTier.trips))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {nextTier.trips > 0 ? (
                    <>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{nextTier.trips} more trips</span> needed to unlock {nextTier.name} tier
                    </>
                  ) : (
                    nextTier.requirements
                  )}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                  Requirements: {nextTier.requirements}
                </p>
              </div>
            </div>
          )}

          {tier === LoyaltyTier.GOLD && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
              <span className="text-3xl mb-2 block">🎉</span>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Congratulations!
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                You've reached the highest tier. Keep riding to maintain your status!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

