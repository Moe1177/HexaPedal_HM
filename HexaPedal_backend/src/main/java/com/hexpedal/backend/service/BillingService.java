package com.hexpedal.backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hexpedal.backend.dto.BillingHistoryDTO;
import com.hexpedal.backend.model.BillingCharge;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.SubscriptionPlan;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.model.UserSubscription;
import com.hexpedal.backend.repository.BillingChargeRepository;
import com.hexpedal.backend.repository.UserRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingChargeRepository billingChargeRepository;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PricingCalculationService pricingService;

    @Transactional
    public BillingCharge createBillingCharge(
            User user,
            Rides ride,
            Integer bikeId,
            SubscriptionPlan plan,
            double durationMinutes) throws StripeException {

        PricingCalculationService.TripCostDetails costDetails = 
                pricingService.calculateCost(plan, durationMinutes);

        BillingCharge charge = BillingCharge.builder()
                .user(user)
                .ride(ride)
                .bikeId(bikeId)
                .planType(plan)
                .startTimestamp(ride.getStartTimestamp())
                .endTimestamp(ride.getEndTimestamp())
                .startLocation(ride.getStartLocation())
                .endLocation(ride.getEndLocation())
                .durationMinutes(durationMinutes)
                .distanceKm(0.0)
                .baseFee(costDetails.getBaseFee())
                .timeCharge(costDetails.getTimeCharge())
                .distanceCharge(0.0)
                .unlockFee(costDetails.getUnlockFee())
                .totalCost(costDetails.getTotalCost())
                .chargeStatus("pending")
                .build();

        String stripeChargeId = chargeUserViaStripe(user, costDetails.getTotalCost(), ride);
        charge.setStripeChargeId(stripeChargeId);
        charge.setChargeStatus("succeeded");

        return billingChargeRepository.save(charge);
    }

    private String ensureStripeCustomer(User user) throws StripeException {
        if (user.getStripeCustomerId() != null) {
            return user.getStripeCustomerId();
        }

        java.util.Map<String, Object> params = new HashMap<>();
        params.put("email", user.getEmail());
        params.put("name", user.getFullName());
        Customer customer = Customer.create(params);
        user.setStripeCustomerId(customer.getId());
        userRepository.save(user);
        return customer.getId();
    }

 
    private String chargeUserViaStripe(User user, double amount, Rides ride) throws StripeException {
        String customerId = ensureStripeCustomer(user);

        long amountCents = Math.round(amount * 100);

        Map<String, Object> params = new HashMap<>();
        params.put("amount", amountCents);
        params.put("currency", "usd");
        params.put("customer", customerId);
        params.put("description", String.format("Trip charge - Bike %d", ride.getBikeId()));
        params.put("metadata", Map.of(
                "ride_id", ride.getRide_id().toString(),
                "bike_id", ride.getBikeId().toString(),
                "user_id", String.valueOf(user.getId())
        ));

        com.stripe.model.PaymentIntent paymentIntent = 
                com.stripe.model.PaymentIntent.create(params);

        try {
            paymentIntent = paymentIntent.confirm();
        } catch (StripeException e) {
        }

        return paymentIntent.getId();
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
                charge.getPlanType().name(),
                charge.getStartTimestamp(),
                charge.getEndTimestamp(),
                charge.getStartLocation(),
                charge.getEndLocation(),
                charge.getDurationMinutes(),
                charge.getDistanceKm(),
                new BillingHistoryDTO.CostSummary(
                        charge.getBaseFee(),
                        charge.getTimeCharge(),
                        charge.getUnlockFee(),
                        charge.getTotalCost()
                ),
                charge.getChargeStatus(),
                charge.getStripeChargeId(),
                charge.getCreatedAt()
        );
    }

    public SubscriptionPlan getUserPlan(Long userId) {
        Optional<UserSubscription> subscription = subscriptionRepository
                .findByUserIdAndStatusIn(userId, List.of("active", "trialing"));
        
        return subscription.map(UserSubscription::getPlan)
                .orElse(SubscriptionPlan.SINGLE_USE);
    }
}

