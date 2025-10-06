package com.hexpedal.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "bikes")
public class Bike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BikeStatus bikeStatus;

    @Column(nullable = false)
    private String type;

    private LocalDate reservationExpDate;
    private LocalTime reservationExpTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User currentUser;

    @Transient
    private static final int RESERVATION_EXPIRY_MINUTES = 10;

    public Bike() {
        this.bikeStatus = BikeStatus.available;
    }

    public Bike(String type) {
        this.type = type;
        this.bikeStatus = BikeStatus.available;
    }


    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public BikeStatus getBikeStatus() {
        return bikeStatus;
    }

    public void setBikeStatus(BikeStatus bikeStatus) {
        this.bikeStatus = bikeStatus;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDate getReservationExpDate() {
        return reservationExpDate;
    }

    public void setReservationExpDate(LocalDate reservationExpDate) {
        this.reservationExpDate = reservationExpDate;
    }

    public LocalTime getReservationExpTime() {
        return reservationExpTime;
    }

    public void setReservationExpTime(LocalTime reservationExpTime) {
        this.reservationExpTime = reservationExpTime;
    }

    public User getCurrentUser() {
        return currentUser;
    }

    public void setCurrentUser(User currentUser) {
        this.currentUser = currentUser;
    }

    public void reserve(User user) {
        if (this.bikeStatus != BikeStatus.available) {
        throw new IllegalStateException("Cannot reserve bike because bike is " + this.bikeStatus);
        }
        this.bikeStatus = BikeStatus.reserved;
        this.currentUser = user;
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(RESERVATION_EXPIRY_MINUTES);
        this.reservationExpDate = expiry.toLocalDate();
        this.reservationExpTime = expiry.toLocalTime();
        }


    public void cancelReservation() {
        if (this.bikeStatus != BikeStatus.reserved) {
        throw new IllegalStateException("Cannot cancel reservation because the bike is not reserved.");
        }
        this.bikeStatus = BikeStatus.available;
        this.currentUser = null;
        this.reservationExpDate = null;
        this.reservationExpTime = null;
        }

    public boolean isReservationExpired() {
        if (reservationExpDate == null || reservationExpTime == null) return false;
        LocalDateTime expiry = LocalDateTime.of(reservationExpDate, reservationExpTime);
        return LocalDateTime.now().isAfter(expiry);
    }
}