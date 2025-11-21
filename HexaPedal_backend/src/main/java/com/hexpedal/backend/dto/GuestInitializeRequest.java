package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.BillingAddress;

public record GuestInitializeRequest(
        String paymentMethodId,
        BillingAddress billingAddress,
        String cardholderName
) {}

