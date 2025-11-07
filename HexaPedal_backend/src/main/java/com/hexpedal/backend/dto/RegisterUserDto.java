package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.BillingAddress;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterUserDto {
    @NotNull(message = "Full name is required")
    private String fullName;
    @NotNull(message = "Address is required")
    private String address;
    @NotNull(message = "Username is required")
    private String username;
    @NotNull(message = "Email is required")
    private String email;
    @NotNull(message = "Password is required")
    private String password;
    @NotNull(message = "Stripe payment method ID is required")
    private String stripePaymentMethodId;
    @NotNull(message = "Billing address is required")
    private BillingAddress billingAddress;
    @NotNull(message = "Cardholder name is required")
    private String cardholderName;

}
