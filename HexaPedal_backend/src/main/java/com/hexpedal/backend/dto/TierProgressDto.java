package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.LoyaltyTier;

record TierProgressDto(
        LoyaltyTier nextTier,
        String nextTierName,
        boolean canUpgrade,
        java.util.List<CriteriaStatusDto> missingCriteria
) {}
