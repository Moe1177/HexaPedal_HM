package com.hexpedal.backend.controller;

import com.hexpedal.backend.service.MapService;
import com.hexpedal.backend.service.ReservationService;
import com.hexpedal.backend.service.StationMarkerService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@Validated
public class ReservationController {

    private final ReservationService reservationService;
    private final MapService mapService;
    private final StationMarkerService stationMarkerService;

    public ReservationController(
            ReservationService reservationService,
            MapService mapService,
            StationMarkerService stationMarkerService) {
        this.reservationService = reservationService;
        this.mapService = mapService;
        this.stationMarkerService = stationMarkerService;
    }

    @PostMapping("/reservations/bikes/{bikeId}")
    public ResponseEntity<Void> reserveBike(
            @PathVariable @Min(1) Integer bikeId,
            @RequestParam @Email String email
    ) {
        reservationService.reserveBike(email, bikeId);
        mapService.updateMap(stationMarkerService.getStationForBike(bikeId));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reservations/{bikeId}/cancel")
    public ResponseEntity<Void> cancelReservation(
            @PathVariable @Min(1) Integer bikeId,
            @RequestParam @Email String email
    ) {
        reservationService.cancelReservation(email, bikeId);
        mapService.updateMap(stationMarkerService.getStationForBike(bikeId));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/trips/{bikeId}/start")
    public ResponseEntity<Void> startTrip(
            @PathVariable @Min(1) Integer bikeId,
            @RequestParam @Min(1) Long userId
    ) {
        reservationService.startTrip(bikeId, userId);
        mapService.updateMap(stationMarkerService.getStationForBike(bikeId));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/trips/return")
    public ResponseEntity<Void> endTrip(
            @RequestParam @Min(1) Integer bikeId,
            @RequestParam @Min(1) Long userId,
            @RequestParam @Min(1) Long stationId
    ) {
        reservationService.endTrip(bikeId, userId, stationId);
        mapService.updateMap(stationMarkerService.getStationForBike(bikeId));
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