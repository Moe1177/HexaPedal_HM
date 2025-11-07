package com.hexpedal.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hexpedal.backend.dto.BillingHistoryDTO;
import com.hexpedal.backend.model.BillingCharge;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.StripePlan;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.model.UserSubscription;
import com.hexpedal.backend.repository.BillingChargeRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import com.stripe.exception.StripeException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingChargeRepository billingChargeRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final StripePlanService stripePlanService;

    /**
     * Create a billing charge record for a trip.
     * No payment is processed - subscription covers all trips.
     */
    @Transactional
    public BillingCharge createBillingCharge(
            User user,
            Rides ride,
            Integer bikeId,
            StripePlan plan) {

        BillingCharge charge = BillingCharge.builder()
                .user(user)
                .ride(ride)
                .bikeId(bikeId)
                .stripePriceId(plan.getPriceId())
                .planName(plan.getDisplayName())
                .startTimestamp(ride.getStartTimestamp())
                .endTimestamp(ride.getEndTimestamp())
                .startLocation(ride.getStartLocation())
                .endLocation(ride.getEndLocation())
                .durationMinutes(ride.getDuration())
                .distanceKm(0.0)
                .chargeStatus("included_in_subscription")
                .build();

        return billingChargeRepository.save(charge);
    }


    public List<BillingHistoryDTO> getBillingHistory(Long userId) {
        List<BillingCharge> charges = billingChargeRepository
                .findByUserIdOrderByStartTimestampDesc(userId);

        return charges.stream()
                .map(this::toBillingHistoryDTO)
                .collect(Collectors.toList());
    }


    private BillingHistoryDTO toBillingHistoryDTO(BillingCharge charge) {
        return new BillingHistoryDTO(
                charge.getId(),
                charge.getRide() != null ? charge.getRide().getRide_id() : null,
                charge.getBikeId(),
                charge.getPlanName() != null ? charge.getPlanName() : "No Plan",
                charge.getStartTimestamp(),
                charge.getEndTimestamp(),
                charge.getStartLocation(),
                charge.getEndLocation(),
                charge.getDurationMinutes(),
                charge.getDistanceKm(),
                charge.getChargeStatus(),
                charge.getStripeChargeId(),
                charge.getCreatedAt()
        );
    }

    /**
     * Get user's active plan from Stripe.
     * Returns null if user has no active subscription.
     */
    public StripePlan getUserPlan(Long userId) throws StripeException {
        Optional<UserSubscription> subscription = subscriptionRepository
                .findByUserIdAndStatusIn(userId, List.of("active", "trialing"));
        
        if (subscription.isPresent() && subscription.get().getStripePriceId() != null) {
            return stripePlanService.getPlanByPriceId(subscription.get().getStripePriceId());
        }
        
        return null;
    }
}

