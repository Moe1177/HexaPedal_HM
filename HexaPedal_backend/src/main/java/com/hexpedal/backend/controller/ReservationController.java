package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.UserReservationStatusDTO;
import com.hexpedal.backend.service.ReservationService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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
    @GetMapping("/reservations/bikes/status")
    public ResponseEntity<UserReservationStatusDTO> getReservationStatus() {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    var dto = reservationService.getCurrentReservationStatus(email);
    return ResponseEntity.ok(dto);
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
    public ResponseEntity<Void> endTrip(
            @RequestParam @Min(1) Integer bikeId,
            @RequestParam @Min(1) Long userId,
            @RequestParam @Min(1) Long stationId
    ) {
        reservationService.endTrip(bikeId, userId, stationId);
        return ResponseEntity.noContent().build();
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