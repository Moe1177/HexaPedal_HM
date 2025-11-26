package com.hexpedal.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "rider_loyalty")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiderLoyalty {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoyaltyTier currentTier = LoyaltyTier.NONE;

    @Enumerated(EnumType.STRING)
    private LoyaltyTier previousTier = LoyaltyTier.NONE;

    @Column(name = "total_trips")
    private int totalTrips = 0;

    @Column(name = "total_successful_returns")
    private int totalSuccessfulReturns = 0;

    @Column(name = "missed_reservations_last_year")
    private int missedReservationsLastYear = 0;

    @Column(name = "trips_last_year")
    private int tripsLastYear = 0;

    @Column(name = "successful_claimed_reservations_last_year")
    private int successfulClaimedReservationsLastYear = 0;

    @Column(name = "last_tier_notification_shown")
    private boolean lastTierNotificationShown = false;

    @Column(name = "tier_changed_at")
    private Instant tierChangedAt;

    @Column(name = "last_evaluated_at")
    private Instant lastEvaluatedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        lastEvaluatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public void upgradeTier(LoyaltyTier newTier) {
        this.previousTier = this.currentTier;
        this.currentTier = newTier;
        this.tierChangedAt = Instant.now();
        this.lastTierNotificationShown = false;
    }

    public void downgradeTier(LoyaltyTier newTier) {
        this.previousTier = this.currentTier;
        this.currentTier = newTier;
        this.tierChangedAt = Instant.now();
        this.lastTierNotificationShown = false;
    }

    public boolean hasUpgraded() {
        return previousTier != null && currentTier.ordinal() > previousTier.ordinal();
    }

    public boolean hasDowngraded() {
        return previousTier != null && currentTier.ordinal() < previousTier.ordinal();
    }

    public double getDiscountPercentage() {
        return currentTier.getDiscountPercentage();
    }

    public int getReservationHoldMinutes() {
        return currentTier.getTotalReservationMinutes();
    }
}