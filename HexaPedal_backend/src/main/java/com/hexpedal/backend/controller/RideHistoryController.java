package com.hexpedal.backend.controller;

import com.hexpedal.backend.dto.RideAuditDto;
import com.hexpedal.backend.dto.RideHistoryDto;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.User;
import com.hexpedal.backend.service.RideHistoryService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@AllArgsConstructor
@RequestMapping("/api/ride-history")
public class RideHistoryController {

    private final RideHistoryService rideHistoryService;

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('RIDER', 'OPERATOR')")
    public ResponseEntity<?> getAllRidesForUser(
            @AuthenticationPrincipal User authenticatedUser,
            @PathVariable Integer userId) {


        if (!(authenticatedUser.getId() == userId.longValue())) {
            return ResponseEntity.status(403).body("You can only view your own ride history");
        }

        List<Rides> rides = rideHistoryService.getRidesByUserId(userId);
        return ResponseEntity.ok(rides);
    }


    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('RIDER', 'OPERATOR')")
    public ResponseEntity<?> getMyRideHistory(@AuthenticationPrincipal User user) {

        List<Rides> rides = rideHistoryService.getRidesByUserId(Math.toIntExact(user.getId()));
        List<RideHistoryDto> rideHistory = rides.stream()
                .map(RideHistoryDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(rideHistory);
    }
    @GetMapping("/audit/all")
    @PreAuthorize("hasRole('OPERATOR')")
    public ResponseEntity<?> getAllRidesForAudit(@AuthenticationPrincipal User user) {
        List<Rides> rides = rideHistoryService.getAllRides();
        List<RideAuditDto> auditLog = rides.stream()
                .map(RideAuditDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(auditLog);
    }
}
