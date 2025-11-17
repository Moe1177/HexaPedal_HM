package com.hexpedal.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.ResourceAccessException;

import java.util.Map;

@RestController
@RequestMapping("/api/routing")
public class RoutingController {

    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${ors.api.key}")
    private String orsApiKey;

    /**
     * Proxy endpoint to fetch routes from OSRM API
     * This bypasses CORS restrictions by making the request from the backend
     */
    @GetMapping("/route")
    public ResponseEntity<?> getRoute(
            @RequestParam double startLat,
            @RequestParam double startLng,
            @RequestParam double endLat,
            @RequestParam double endLng
    ) {
        try {
            // Try cycling-regular profile first (best for bike sharing)
            String bikeUrl = String.format(
                "https://api.openrouteservice.org/v2/directions/cycling-regular?api_key=%s&start=%f,%f&end=%f,%f",
                orsApiKey, startLng, startLat, endLng, endLat
            );
            
            try {
                ResponseEntity<Object> bikeResponse = restTemplate.getForEntity(bikeUrl, Object.class);
                if (bikeResponse.getStatusCode().is2xxSuccessful() && bikeResponse.getBody() != null) {
                    return ResponseEntity.ok(bikeResponse.getBody());
                }
            } catch (Exception e) {
                // If bike profile fails, try driving profile
                System.out.println("Bike routing failed, trying driving profile: " + e.getMessage());
            }
            
            // Fallback to driving-car profile
            String drivingUrl = String.format(
                "https://api.openrouteservice.org/v2/directions/driving-car?api_key=%s&start=%f,%f&end=%f,%f",
                orsApiKey, startLng, startLat, endLng, endLat
            );
            
            ResponseEntity<Object> drivingResponse = restTemplate.getForEntity(drivingUrl, Object.class);
            return ResponseEntity.ok(drivingResponse.getBody());
            
        } catch (ResourceAccessException e) {
            System.err.println("Failed to connect to routing service: " + e.getMessage());
            return ResponseEntity.status(503).body(Map.of(
                "error", "Routing service unavailable",
                "message", "Could not connect to external routing service"
            ));
        } catch (Exception e) {
            System.err.println("Error fetching route: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to fetch route",
                "message", e.getMessage()
            ));
        }
    }
}

