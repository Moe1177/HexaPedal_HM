package com.hexpedal.backend.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "billing_charges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingCharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ride_id")
    private Rides ride;

    @Column(name = "bike_id", nullable = false)
    private Integer bikeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false)
    private SubscriptionPlan planType;

    @Column(name = "start_timestamp", nullable = false)
    private Instant startTimestamp;

    @Column(name = "end_timestamp", nullable = false)
    private Instant endTimestamp;

    @Column(name = "start_location", nullable = false)
    private String startLocation;

    @Column(name = "end_location", nullable = false)
    private String endLocation;

    @Column(name = "duration_minutes", nullable = false)
    private Double durationMinutes;

    @Column(name = "distance_km", nullable = false)
    private Double distanceKm;

    @Column(name = "base_fee", nullable = false)
    private Double baseFee;

    @Column(name = "time_charge", nullable = false)
    private Double timeCharge;

    @Column(name = "distance_charge", nullable = false)
    private Double distanceCharge;

    @Column(name = "unlock_fee", nullable = false)
    private Double unlockFee;

    @Column(name = "total_cost", nullable = false)
    private Double totalCost;

    @Column(name = "stripe_charge_id", unique = true)
    private String stripeChargeId;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @Column(name = "charge_status", nullable = false)
    private String chargeStatus; // succeeded, pending, failed, refunded

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}

