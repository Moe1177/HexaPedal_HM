// Loyalty tier types matching backend enums and DTOs

export enum LoyaltyTier {
  NONE = "NONE",
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD"
}

export interface CriteriaStatus {
  criteriaId: string;
  description: string;
  met: boolean;
  progressDetail: string;
}

export interface TierProgress {
  nextTier: LoyaltyTier | null;
  nextTierName: string | null;
  canUpgrade: boolean;
  missingCriteria: CriteriaStatus[];
}

export interface LoyaltyStatus {
  currentTier: LoyaltyTier;
  previousTier: LoyaltyTier | null;
  discountPercentage: number;
  reservationHoldMinutes: number;
  totalTrips: number;
  tripsLastYear: number;
  missedReservationsLastYear: number;
  successfulClaimedReservationsLastYear: number;
  hasNotification: boolean;
  upgraded: boolean;
  downgraded: boolean;
  tierChangedAt: string | null;
  progress: TierProgress;
}

// Utility functions for tier display
export function getTierColor(tier: LoyaltyTier): string {
  switch (tier) {
    case LoyaltyTier.BRONZE:
      return "from-amber-600 to-orange-700";
    case LoyaltyTier.SILVER:
      return "from-slate-400 to-slate-500";
    case LoyaltyTier.GOLD:
      return "from-yellow-500 to-amber-400";
    case LoyaltyTier.NONE:
    default:
      return "from-neutral-400 to-neutral-500";
  }
}

export function getTierBorderColor(tier: LoyaltyTier): string {
  switch (tier) {
    case LoyaltyTier.BRONZE:
      return "border-amber-600 dark:border-amber-500";
    case LoyaltyTier.SILVER:
      return "border-slate-400 dark:border-slate-400";
    case LoyaltyTier.GOLD:
      return "border-yellow-500 dark:border-yellow-400";
    case LoyaltyTier.NONE:
    default:
      return "border-neutral-400 dark:border-neutral-500";
  }
}

export function getTierBackgroundColor(tier: LoyaltyTier): string {
  switch (tier) {
    case LoyaltyTier.BRONZE:
      return "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20";
    case LoyaltyTier.SILVER:
      return "from-slate-50 to-zinc-50 dark:from-slate-900/20 dark:to-zinc-900/20";
    case LoyaltyTier.GOLD:
      return "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20";
    case LoyaltyTier.NONE:
    default:
      return "from-neutral-50 to-neutral-100 dark:from-neutral-900/20 dark:to-neutral-800/20";
  }
}

export function getTierName(tier: LoyaltyTier): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

export function getTierDiscount(tier: LoyaltyTier): number {
  switch (tier) {
    case LoyaltyTier.BRONZE:
      return 5;
    case LoyaltyTier.SILVER:
      return 10;
    case LoyaltyTier.GOLD:
      return 15;
    case LoyaltyTier.NONE:
    default:
      return 0;
  }
}

export function getTierReservationMinutes(tier: LoyaltyTier): number {
  switch (tier) {
    case LoyaltyTier.BRONZE:
      return 10;
    case LoyaltyTier.SILVER:
      return 12;
    case LoyaltyTier.GOLD:
      return 15;
    case LoyaltyTier.NONE:
    default:
      return 10;
  }
}

