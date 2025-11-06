package com.hexpedal.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pricing_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "plan_name", nullable = false, unique = true)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Double baseFee;

    @Column(nullable = false)
    private Double perMinuteFee;

    private Integer freeMinutes;

    private Double maxCostPerTrip;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean defaultPlan = false;
}
