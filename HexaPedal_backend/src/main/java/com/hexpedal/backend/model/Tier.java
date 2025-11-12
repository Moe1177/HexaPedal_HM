package com.hexpedal.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "tiers")
@Data
public class Tier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String name;

    @Column(nullable = false)
    private Integer rank; // 0=NONE, 1=BRONZE, 2=SILVER, 3=GOLD

    @Column(name = "discount_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal discountRate;

    @Column(name = "extra_reservation_minutes", nullable = false)
    private Integer extraReservationMinutes;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "requirements_json", columnDefinition = "TEXT")
    private String requirementsJson;

    @Column(nullable = false)
    private Boolean active = true; // For future: disable/enable tiers

    // Helper methods
    public boolean isHigherThan(Tier other) {
        return this.rank > other.rank;
    }

    public boolean isLowerThan(Tier other) {
        return this.rank < other.rank;
    }
}
