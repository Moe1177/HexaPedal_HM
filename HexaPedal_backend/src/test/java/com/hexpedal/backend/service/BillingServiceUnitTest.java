package com.hexpedal.backend.service;

import com.hexpedal.backend.model.PlanType;
import com.hexpedal.backend.model.SubscriptionPlan;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.model.UserSubscription;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.repository.SubscriptionPlanRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BillingServiceUnitTest {
    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @InjectMocks
    private BillingService billingService;

    @Test
    public void calculateTripCostPayPerTrip_ReturnsDouble(){
        User testUser = User.builder().
                id(1L).
                build();

        SubscriptionPlan testSubscriptionPlan = SubscriptionPlan.builder().
                planType(PlanType.PAY_PER_TRIP).
                ratePerMinute(BigDecimal.valueOf(0.01)).
                build();

        UserSubscription userSubscription = UserSubscription.builder().
                user(testUser).
                plan(testSubscriptionPlan).
                build();
        
        when(userSubscriptionRepository.findActiveSubscriptionByUserId(1L)).thenReturn(Optional.of(userSubscription));
        when(subscriptionPlanRepository.findByPlanType(PlanType.PAY_PER_TRIP)).thenReturn(Optional.of(testSubscriptionPlan));

        double testCost = billingService.calculateTripCost(1L, 5);
        Assertions.assertThat(testCost).isEqualTo(0.05);
    }

    @Test
    public void generateCostBreakdown_ReturnsString(){
        User testUser = User.builder().
                id(1L).
                build();

        SubscriptionPlan testSubscriptionPlan = SubscriptionPlan.builder().
                planType(PlanType.PAY_PER_TRIP).
                build();

        UserSubscription testActiveSubscription = UserSubscription.builder().
                user(testUser).
                plan(testSubscriptionPlan).
                build();

        when(userSubscriptionRepository.findActiveSubscriptionByUserId(1L)).thenReturn(Optional.of(testActiveSubscription));

        String testBreakdown = billingService.generateCostBreakdown(1L, 5, 0.05);

        Assertions.assertThat(testBreakdown).contains("Pay-per-trip:");
    }
}
