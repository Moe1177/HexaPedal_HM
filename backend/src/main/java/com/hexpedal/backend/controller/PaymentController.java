package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.AddStripeMethodRequest;
import com.hexpedal.backend.dto.PaymentMethodDto;
import com.hexpedal.backend.model.PaymentMethod;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/methods")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentMethodDto> getPaymentMethod(@AuthenticationPrincipal User user) {
        return paymentService.getDefaultPaymentMethod(user.getId())
                .map(pm -> ResponseEntity.ok(PaymentMethodDto.from(pm)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/methods/stripe")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentMethodDto> addStripeMethod(
            @AuthenticationPrincipal User user,
            @RequestBody AddStripeMethodRequest req) throws Exception {

        PaymentMethod saved = paymentService.saveStripePaymentMethod(
                user.getId(),
                req.paymentMethodId(), // "pm_xxx" from frontend
                req.billingAddress(),
                req.cardholderName()
        );
        return ResponseEntity.ok(PaymentMethodDto.from(saved));
    }
}