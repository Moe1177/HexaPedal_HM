package com.hexpedal.backend.controller;

import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.service.RideHistoryService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/ride-history")
public class RideHistoryController {

    private final RideHistoryService rideHistoryService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<Rides>> getAllRidesForUser(@PathVariable Integer userId) {
        List<Rides> rides = rideHistoryService.getRidesByUserId(userId);

        return ResponseEntity.ok(rides);
    }
}
