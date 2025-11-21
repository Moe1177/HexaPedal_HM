package com.hexpedal.backend.controller;

import com.hexpedal.backend.BaseIntegrationTest;
import com.hexpedal.backend.dto.BillingHistoryDto;
import com.hexpedal.backend.dto.TripSummaryDto;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

public class BillingControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void getTripSummary_ReturnsForbidden_WhenNotAuthenticated() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/billing/trip/6001",
                HttpMethod.GET,
                requestEntity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).contains("Only riders can view billing information");
    }

    @Test
    void getBillingHistory_ReturnsForbidden_WhenNotAuthenticated() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/billing/history",
                HttpMethod.GET,
                requestEntity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).contains("Only riders can view billing history");
    }

    @Test
    void calculateTripCost_ReturnsForbidden_WhenNotAuthenticated() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/billing/calculate-trip-cost?rideId=6001",
                HttpMethod.POST,
                requestEntity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).contains("Only riders can calculate trip costs");
    }

    @Test
    void getTripSummary_ReturnsNotFound_WhenRideNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/billing/trip/9999",
                HttpMethod.GET,
                requestEntity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void calculateTripCost_ReturnsNotFound_WhenRideNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/billing/calculate-trip-cost?rideId=9999",
                HttpMethod.POST,
                requestEntity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}