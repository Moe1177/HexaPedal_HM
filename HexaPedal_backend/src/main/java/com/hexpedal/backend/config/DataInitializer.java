package com.hexpedal.backend.config;

import com.hexpedal.backend.model.PlanType;
import com.hexpedal.backend.model.SubscriptionPlan;
import com.hexpedal.backend.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Initialize the database with the three subscription plans.
 * Note: You must create corresponding Price objects in Stripe Dashboard
 * and update the stripePriceId values below with the actual Stripe Price IDs.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeSubscriptionPlans();
    }

    private void initializeSubscriptionPlans() {
        // Check if plans already exist
        if (subscriptionPlanRepository.count() > 0) {
            System.out.println("Subscription plans already initialized.");
            return;
        }

        // Monthly Subscription Plan
        SubscriptionPlan monthlyPlan = SubscriptionPlan.builder()
                .planType(PlanType.MONTHLY)
                .name("Monthly Subscription")
                .price(new BigDecimal("12.00"))
                .stripePriceId("price_monthly_12cad") // TODO: Replace with actual Stripe Price ID
                .description("Unlimited rides for one month at $12 CAD/month")
                .active(true)
                .ratePerKm(BigDecimal.ZERO) // Unlimited rides, no per-km charge
                .build();

        // Yearly Subscription Plan
        SubscriptionPlan yearlyPlan = SubscriptionPlan.builder()
                .planType(PlanType.YEARLY)
                .name("Yearly Subscription")
                .price(new BigDecimal("100.00"))
                .stripePriceId("price_yearly_100cad") // TODO: Replace with actual Stripe Price ID
                .description("Unlimited rides for one year at $100 CAD/year")
                .active(true)
                .ratePerKm(BigDecimal.ZERO) // Unlimited rides, no per-km charge
                .build();

        // Pay-Per-Trip Plan
        SubscriptionPlan payPerTripPlan = SubscriptionPlan.builder()
                .planType(PlanType.PAY_PER_TRIP)
                .name("Pay Per Trip")
                .price(BigDecimal.ZERO) // No subscription fee
                .stripePriceId(null) // Not a recurring subscription
                .description("Pay as you go at $0.10 CAD per kilometer")
                .active(true)
                .ratePerKm(new BigDecimal("0.10")) // $0.10 per km
                .build();

        subscriptionPlanRepository.save(monthlyPlan);
        subscriptionPlanRepository.save(yearlyPlan);
        subscriptionPlanRepository.save(payPerTripPlan);

        System.out.println("✅ Subscription plans initialized successfully!");
        System.out.println("📝 NOTE: Update the Stripe Price IDs in DataInitializer.java");
        System.out.println("   - Monthly plan: price_monthly_12cad (replace with actual Stripe Price ID)");
        System.out.println("   - Yearly plan: price_yearly_100cad (replace with actual Stripe Price ID)");
    }
}

