package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.GuestConversionRequest;
import com.hexpedal.backend.dto.GuestInitializeRequest;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.service.GuestSessionService;
import com.hexpedal.backend.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.Min;


@RestController
@RequestMapping("/api/guest")
@RequiredArgsConstructor
public class GuestTripController {

    private final GuestSessionService guestSessionService;
    private final ReservationService reservationService;


    @PostMapping("/initialize")
    public ResponseEntity<?> initializeGuestSession(@RequestBody GuestInitializeRequest request) {
        try {
            GuestSessionService.GuestSessionResponse response = guestSessionService.createGuestSession(
                    request.paymentMethodId(),
                    request.billingAddress(),
                    request.cardholderName()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to initialize guest session: " + e.getMessage());
        }
    }


    @PostMapping("/trips/{bikeId}/start")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> startGuestTrip(
            @PathVariable Integer bikeId,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) java.util.Map<String, Object> destinationData) {
        try {
            // Verify this is a guest user
            if (user.getIsGuest() == null || !user.getIsGuest()) {
                return ResponseEntity.badRequest().body("This endpoint is for guest users only");
            }

            // Use the standard trip start logic (which now works with guest users)
            reservationService.startTrip(bikeId, user.getEmail(), destinationData);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to start trip: " + e.getMessage());
        }
    }


    @PostMapping("/convert")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> convertGuestAccount(
            @RequestBody GuestConversionRequest request,
            @AuthenticationPrincipal User user) {
        try {
            // Verify this is a guest user
            if (user.getIsGuest() == null || !user.getIsGuest()) {
                return ResponseEntity.badRequest().body("User is not a guest user");
            }

            GuestSessionService.ConversionResponse response = guestSessionService.convertGuestToRegisteredUser(
                    user.getId(),
                    request.fullName(),
                    request.email(),
                    request.username(),
                    request.password()
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to convert account: " + e.getMessage());
        }
    }


    @DeleteMapping("/account")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteGuestAccount(@AuthenticationPrincipal User user) {
        try {
            // Verify this is a guest user
            if (user.getIsGuest() == null || !user.getIsGuest()) {
                return ResponseEntity.badRequest().body("User is not a guest user");
            }

            guestSessionService.deleteGuestUser(user.getId());
            return ResponseEntity.ok("Guest account deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete account: " + e.getMessage());
        }
    }
}

