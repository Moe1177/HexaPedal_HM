package com.hexpedal.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.hexpedal.backend.model.StripePlan;
import com.stripe.exception.StripeException;
import com.stripe.model.Price;
import com.stripe.model.Product;
import com.stripe.param.PriceListParams;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripePlanService {

    /**
     * Fetch all active subscription plans from Stripe
     */
    public List<StripePlan> getActivePlans() throws StripeException {
        PriceListParams params = PriceListParams.builder()
                .setActive(true)
                .setType(PriceListParams.Type.RECURRING)
                .build();

        List<Price> prices = Price.list(params).getData();

        return prices.stream()
                .map(this::priceToStripePlan)
                .collect(Collectors.toList());
    }

    /**
     * Get a plan by Stripe Price ID
     */
    public StripePlan getPlanByPriceId(String priceId) throws StripeException {
        Price price = Price.retrieve(priceId);
        return priceToStripePlan(price);
    }

    /**
     * Convert Stripe Price to StripePlan
     */
    private StripePlan priceToStripePlan(Price price) {
        try {
            Product product = price.getProductObject();
            String displayName = product.getName();
            
            return StripePlan.builder()
                    .priceId(price.getId())
                    .productId(price.getProduct())
                    .displayName(displayName != null ? displayName : "Subscription Plan")
                    .interval(price.getRecurring() != null ? price.getRecurring().getInterval() : null)
                    .amount(price.getUnitAmount())
                    .currency(price.getCurrency())
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Error converting Stripe Price to plan: " + e.getMessage(), e);
        }
    }
}

