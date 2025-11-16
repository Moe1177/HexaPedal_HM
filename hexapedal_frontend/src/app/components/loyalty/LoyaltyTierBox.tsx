"use client";

import { useState } from "react";
import { LoyaltyStatus, LoyaltyTier, getTierName, getTierBackgroundColor, getTierBorderColor } from "@/types/Loyalty";

interface LoyaltyTierBoxProps {
  loyaltyStatus: LoyaltyStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
  onShowDetails: () => void;
}

export default function LoyaltyTierBox({ 
  loyaltyStatus, 
  isLoading, 
  onRefresh, 
  onShowDetails 
}: LoyaltyTierBoxProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900/20 dark:to-neutral-800/20 rounded-lg border border-neutral-200 dark:border-neutral-700 animate-pulse">
        <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-24 mb-2"></div>
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
      </div>
    );
  }

  if (!loyaltyStatus) {
    return (
      <div className="mt-8 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-700">
        <h4 className="font-semibold mb-1 text-neutral-900 dark:text-neutral-100">Loyalty Status</h4>
        <p className="text-xs text-red-600 dark:text-red-400">Failed to load</p>
      </div>
    );
  }

  const tier = loyaltyStatus.currentTier;
  const tierName = getTierName(tier);
  const backgroundGradient = getTierBackgroundColor(tier);
  const borderColor = getTierBorderColor(tier);

  return (
    <div 
      className={`mt-8 p-4 bg-gradient-to-br ${backgroundGradient} rounded-lg border ${borderColor} cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={onShowDetails}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
          {tier === LoyaltyTier.NONE ? "Loyalty Program" : `${tierName} Tier`}
        </h4>
        {tier !== LoyaltyTier.NONE && (
          <span className="text-lg">
            {tier === LoyaltyTier.BRONZE && "🥉"}
            {tier === LoyaltyTier.SILVER && "🥈"}
            {tier === LoyaltyTier.GOLD && "🥇"}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        {loyaltyStatus.discountPercentage > 0 ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {(loyaltyStatus.discountPercentage * 100).toFixed(0)}% Discount on rides
          </p>
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Start riding to unlock benefits
          </p>
        )}
        
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          {loyaltyStatus.totalTrips} total trips
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRefresh();
          }}
          disabled={isRefreshing}
          className="flex-1 px-3 py-1.5 bg-white/50 dark:bg-neutral-800/50 hover:bg-white/80 dark:hover:bg-neutral-800/80 rounded text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors disabled:opacity-50"
        >
          {isRefreshing ? (
            <span className="flex items-center justify-center gap-1">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </span>
          ) : (
            "Refresh Tier"
          )}
        </button>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2 text-center">
        Click for details
      </p>
    </div>
  );
}

