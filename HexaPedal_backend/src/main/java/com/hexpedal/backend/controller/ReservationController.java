package com.hexpedal.backend.controller;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hexpedal.backend.dto.TripSummaryDTO;
import com.hexpedal.backend.service.ReservationService;
import com.stripe.exception.StripeException;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api")
@Validated
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }
    
    @PostMapping("/reservations/bikes/{bikeId}")
    public ResponseEntity<Void> reserveBike(@PathVariable Integer bikeId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName(); 
        
        reservationService.reserveBike(email, bikeId);
        return ResponseEntity.noContent().build();
    }
  
    
    

    @PostMapping("/reservations/{bikeId}/cancel")
    public ResponseEntity<Void> cancelReservation(@PathVariable @Min(1) Integer bikeId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        reservationService.cancelReservation(email, bikeId);
        return ResponseEntity.noContent().build();
    }
    

    @PostMapping("/trips/{bikeId}/start")
    public ResponseEntity<Void> startTrip(@PathVariable Integer bikeId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        reservationService.startTrip(bikeId, email);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/trips/return")
    public ResponseEntity<TripSummaryDTO> endTrip(
            @RequestParam @Min(1) Integer bikeId,
            @RequestParam @Min(1) Long userId,
            @RequestParam @Min(1) Long stationId
    ) throws StripeException {
        TripSummaryDTO summary = reservationService.endTrip(bikeId, userId, stationId);
        return ResponseEntity.ok(summary);
    }

     @PostMapping("/trips/guest/{bikeId}/start")
     public ResponseEntity<Void> startGuestTrip(@PathVariable Integer bikeId) {
         reservationService.startGuestTrip(bikeId);
         return ResponseEntity.noContent().build();
     }
 

     @PostMapping("/trips/guest/return")
     public ResponseEntity<Void> endGuestTrip(
             @RequestParam @Min(1) Integer bikeId,
             @RequestParam @Min(1) Long stationId
     ) {
         reservationService.endGuestTrip(bikeId, stationId);
         return ResponseEntity.noContent().build();
     }

    @PostMapping("/reservations/expire")
    public ResponseEntity<Void> expireReservations() {
        reservationService.expireReservations();
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }
}