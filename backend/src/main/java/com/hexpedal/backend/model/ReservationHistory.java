package com.hexpedal.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "reservation_history", indexes = {
    @Index(name = "idx_rider_created", columnList = "rider_id,reservation_created_at"),
    @Index(name = "idx_outcome_created", columnList = "outcome,reservation_created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rider_id", nullable = false)
    private User rider;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bike_id", nullable = false)
    private Bike bike;

    @Column(name = "reservation_created_at", nullable = false)
    private Instant reservationCreatedAt;

    @Column(name = "reservation_expiry_at", nullable = false)
    private Instant reservationExpiryAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReservationOutcome outcome = ReservationOutcome.PENDING;

    @Column(name = "claimed_at")
    private Instant claimedAt;

    @Column(name = "outcome_changed_at")
    private Instant outcomeChangedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (reservationCreatedAt == null) {
            reservationCreatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Updates the outcome of this reservation
     */
    public void updateOutcome(ReservationOutcome newOutcome) {
        this.outcome = newOutcome;
        this.outcomeChangedAt = Instant.now();
        
        if (newOutcome == ReservationOutcome.CLAIMED) {
            this.claimedAt = Instant.now();
        }
    }
}

