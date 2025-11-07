package com.hexpedal.backend.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.hexpedal.backend.model.BillingAddress;
import com.hexpedal.backend.model.PaymentBrand;
import com.hexpedal.backend.model.PaymentMethod;
import com.hexpedal.backend.model.PaymentMethodType;
import com.hexpedal.backend.model.PaymentProvider;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.repository.PaymentMethodRepository;
import com.hexpedal.backend.repository.UserRepository;
import com.stripe.exception.StripeException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentMethodRepository paymentMethodRepo;
    private final UserRepository userRepo;

    private String ensureStripeCustomer(User user) throws StripeException {
        if (user.getStripeCustomerId() != null) return user.getStripeCustomerId();
        Map<String, Object> params = new HashMap<>();
        params.put("email", user.getEmail());
        params.put("name", user.getFullName());
        com.stripe.model.Customer customer = com.stripe.model.Customer.create(params);
        user.setStripeCustomerId(customer.getId());
        userRepo.save(user);
        return customer.getId();
    }

    public PaymentMethod saveStripePaymentMethod(Long userId, String stripePaymentMethodId,
                                                 BillingAddress billingAddress, String cardholderName)
            throws Exception {

        User user = userRepo.findById(userId).orElseThrow();
        String customerId = ensureStripeCustomer(user);

        Map<String, Object> attachParams = new HashMap<>();
        attachParams.put("customer", customerId);
        com.stripe.model.PaymentMethod pm = com.stripe.model.PaymentMethod.retrieve(stripePaymentMethodId);
        pm = pm.attach(attachParams);

        Map<String, Object> invoiceSettings = Map.of("default_payment_method", stripePaymentMethodId);
        com.stripe.model.Customer updated = com.stripe.model.Customer.retrieve(customerId)
                .update(Map.of("invoice_settings", invoiceSettings));

        // Extract safe card details for your DB
        com.stripe.model.PaymentMethod.Card card = pm.getCard();

        PaymentMethod entity = PaymentMethod.builder()
                .user(user)
                .provider(PaymentProvider.STRIPE)
                .type(PaymentMethodType.CARD)
                .providerPaymentMethodId(pm.getId())
                .cardHolderName(cardholderName)
                .brand(mapBrand(card.getBrand()))
                .last4(card.getLast4())
                .expMonth(Math.toIntExact(card.getExpMonth()))
                .expYear(Math.toIntExact(card.getExpYear()))
                .billingAddress(billingAddress)
                .defaultMethod(true)
                .active(true)
                .build();

        paymentMethodRepo.findByUserIdAndDefaultMethodTrue(userId)
                .ifPresent(old -> { old.setDefaultMethod(false); paymentMethodRepo.save(old); });

        return paymentMethodRepo.save(entity);
    }

    private PaymentBrand mapBrand(String stripeBrand) {
        if (stripeBrand == null) return PaymentBrand.OTHER;
        return switch (stripeBrand.toLowerCase()) {
            case "visa" -> PaymentBrand.VISA;
            case "mastercard" -> PaymentBrand.MASTERCARD;
            case "amex" -> PaymentBrand.AMEX;
            case "discover" -> PaymentBrand.DISCOVER;
            default -> PaymentBrand.OTHER;
        };
    }
}
