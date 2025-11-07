package com.hexpedal.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private PlanType planType;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "stripe_price_id")
    private String stripePriceId;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "rate_per_km", precision = 10, scale = 2)
    private BigDecimal ratePerKm;
}

