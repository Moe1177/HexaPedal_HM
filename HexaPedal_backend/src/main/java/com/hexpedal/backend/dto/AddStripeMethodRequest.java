package com.hexpedal.backend.dto;


import com.hexpedal.backend.model.BillingAddress;

public record AddStripeMethodRequest(
        String paymentMethodId,
        String cardholderName,
        BillingAddress billingAddress
) {}
