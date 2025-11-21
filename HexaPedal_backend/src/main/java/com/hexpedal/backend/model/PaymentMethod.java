package com.hexpedal.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethod {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodType type;

    @Column(nullable = false, unique = true)
    private String providerPaymentMethodId;

    private String cardHolderName;
    @Enumerated(EnumType.STRING)
    private PaymentBrand brand;
    private String last4;
    private Integer expMonth;
    private Integer expYear;

    @Embedded
    private BillingAddress billingAddress;

    private boolean defaultMethod;
    private boolean active = true;
}

