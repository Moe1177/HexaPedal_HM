package com.hexpedal.backend.controller;

import com.hexpedal.backend.BaseIntegrationTest;
import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.BikeStatus;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

public class BikeControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void getAllBikes_ReturnsListOfBikes() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Bike[]> response = restTemplate.exchange(
                "/api/bikes",
                HttpMethod.GET,
                requestEntity,
                Bike[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isInstanceOf(Bike[].class);
    }

    @Test
    void createBike_ReturnsCreatedBike() {
        Bike bike = new Bike();
        bike.setType("mountain");
        bike.setBikeStatus(BikeStatus.available);

        HttpEntity<Bike> requestEntity = createEntity(bike);

        ResponseEntity<Bike> response = restTemplate.exchange(
                "/api/bikes",
                HttpMethod.POST,
                requestEntity,
                Bike.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getBikeStatus()).isEqualTo(BikeStatus.available);
    }

    @Test
    void updateBikeStatus_ReturnsUpdatedBike() {
        // Update the bike status
        ResponseEntity<Bike> response = restTemplate.exchange(
                "/api/bikes/" + 6 + "/status?status=available",
                HttpMethod.PUT,
                createEntity(),
                Bike.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getBikeStatus()).isEqualTo(BikeStatus.available);
    }

    @Test
    void updateBikeStatus_ReturnsInternalServerError_WhenBikeNotExists() {
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/bikes/9999/status?status=available",
                HttpMethod.PUT,
                createEntity(),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}