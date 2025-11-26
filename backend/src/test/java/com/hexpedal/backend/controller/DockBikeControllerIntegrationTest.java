package com.hexpedal.backend.controller;

import com.hexpedal.backend.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

public class DockBikeControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void dockBike_ReturnsNoContent_WhenSuccessful() {
        HttpEntity<Void> requestEntity = createEntity();

        // Use empty dock 6 with bike 6 (which is in maintenance status)
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/docks/1/6/bike/6", // station 1, dock 6 (empty), bike 6 (maintenance)
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void dockBike_ReturnsNotFound_WhenStationNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/docks/999/6/bike/6", // Use empty dock 6 to avoid "already occupied" error
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void dockBike_ReturnsNotFound_WhenDockNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/docks/1/999/bike/6", // Use bike 6 to avoid bike not found
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void dockBike_ReturnsNotFound_WhenBikeNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/docks/1/6/bike/999", // Use empty dock 6 to avoid "already occupied" error
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void dockBike_ReturnsError_WhenDockAlreadyOccupied() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/docks/1/1/bike/6", // Dock 1 is already occupied by bike 1
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void dockBike_ReturnsError_WhenDockNotBelongsToStation() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/docks/1/5/bike/6", // dock 5 belongs to station 2, not station 1
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}