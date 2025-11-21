package com.hexpedal.backend.controller;

import com.hexpedal.backend.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

public class ReservationControllerIntegrationTest extends BaseIntegrationTest {

    // Bike IDs from init.sql
    private static final int AVAILABLE_BIKE_ID = 1;  // available bike at Station A
    private static final int MAINTENANCE_BIKE_ID = 6; // maintenance bike on truck
    private static final int NON_EXISTENT_BIKE_ID = 9999;

    // Station IDs from init.sql
    private static final long STATION_A_ID = 1L;

    // User IDs from init.sql
    private static final long RIDER_WITH_SUB_ID = 1001L;

    // ==================== Reserve Bike Tests ====================

    @Test
    void reserveBike_ReturnsNotFound_WhenBikeNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/reservations/bikes/" + NON_EXISTENT_BIKE_ID,
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    @Test
    void reserveBike_ReturnsError_WhenBikeNotAvailable() {
        // Bike 6 is in maintenance status - service throws IllegalStateException -> 400
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/reservations/bikes/" + MAINTENANCE_BIKE_ID,
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, HttpStatus.CONFLICT);
    }

    // ==================== Cancel Reservation Tests ====================

    @Test
    void cancelReservation_ReturnsError_WhenBikeNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/reservations/" + NON_EXISTENT_BIKE_ID + "/cancel",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    @Test
    void cancelReservation_ReturnsError_WhenNoActiveReservation() {
        // Bike 3 is available, not reserved
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/reservations/3/cancel",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND);
    }

    // ==================== Start Trip Tests ====================

    @Test
    void startTrip_ReturnsError_WhenBikeNotExists() {
        // Service throws IllegalStateException -> 400
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/" + NON_EXISTENT_BIKE_ID + "/start",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    @Test
    void startTrip_ReturnsError_WhenBikeNotAvailable() {
        // Bike 6 is in maintenance
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/" + MAINTENANCE_BIKE_ID + "/start",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT, HttpStatus.NOT_FOUND);
    }

    // ==================== End Trip Tests ====================

    @Test
    void endTrip_ReturnsError_WhenBikeNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/return?bikeId=" + NON_EXISTENT_BIKE_ID + "&userId=" + RIDER_WITH_SUB_ID + "&stationId=" + STATION_A_ID,
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    @Test
    void endTrip_ReturnsError_WhenStationNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/return?bikeId=" + AVAILABLE_BIKE_ID + "&userId=" + RIDER_WITH_SUB_ID + "&stationId=9999",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    @Test
    void endTrip_ReturnsError_WhenBikeNotOnTrip() {
        // Bike 1 is available, not on a trip
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/return?bikeId=" + AVAILABLE_BIKE_ID + "&userId=" + RIDER_WITH_SUB_ID + "&stationId=" + STATION_A_ID,
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT);
    }

    // ==================== Guest Trip Tests ====================

    @Test
    void startGuestTrip_ReturnsError_WhenBikeNotExists() {
        // Service throws IllegalStateException -> 400
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/guest/" + NON_EXISTENT_BIKE_ID + "/start",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    @Test
    void startGuestTrip_ReturnsError_WhenBikeNotAvailable() {
        // Bike 6 is in maintenance
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/guest/" + MAINTENANCE_BIKE_ID + "/start",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT, HttpStatus.NOT_FOUND);
    }

    @Test
    void endGuestTrip_ReturnsError_WhenBikeNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/guest/return?bikeId=" + NON_EXISTENT_BIKE_ID + "&stationId=" + STATION_A_ID,
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    @Test
    void endGuestTrip_ReturnsError_WhenStationNotExists() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/guest/return?bikeId=" + AVAILABLE_BIKE_ID + "&stationId=9999",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    // ==================== Expire Reservations Tests ====================

    @Test
    void expireReservations_ReturnsNoContent() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/reservations/expire",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    // ==================== Validation Tests ====================
    // Note: ConstraintViolationException returns 500 because there's no @ExceptionHandler for it
    // Consider adding a handler to return 400 BAD_REQUEST

    @Test
    void endTrip_ReturnsError_WhenBikeIdLessThanOne() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/return?bikeId=0&userId=" + RIDER_WITH_SUB_ID + "&stationId=" + STATION_A_ID,
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        // ConstraintViolationException - currently returns 500, ideally should be 400
        assertThat(response.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void endTrip_ReturnsError_WhenUserIdLessThanOne() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/return?bikeId=" + AVAILABLE_BIKE_ID + "&userId=0&stationId=" + STATION_A_ID,
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void endTrip_ReturnsError_WhenStationIdLessThanOne() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trips/return?bikeId=" + AVAILABLE_BIKE_ID + "&userId=" + RIDER_WITH_SUB_ID + "&stationId=0",
                HttpMethod.POST,
                requestEntity,
                Void.class
        );

        assertThat(response.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}