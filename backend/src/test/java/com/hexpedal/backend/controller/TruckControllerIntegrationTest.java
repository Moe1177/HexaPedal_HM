package com.hexpedal.backend.controller;

import com.hexpedal.backend.BaseIntegrationTest;
import com.hexpedal.backend.dto.CreateTruckRequestDTO;
import com.hexpedal.backend.model.Truck;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

public class TruckControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void getAllTrucks_ReturnsListOfTrucks() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<Truck[]> response = restTemplate.exchange(
                "/api/trucks",
                HttpMethod.GET,
                requestEntity,
                Truck[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isInstanceOf(Truck[].class);
    }

    @Test
    void createTruck_ReturnsCreatedTruck() {
        CreateTruckRequestDTO request = new CreateTruckRequestDTO(15);

        HttpEntity<CreateTruckRequestDTO> requestEntity = createEntity(request);

        ResponseEntity<Truck> response = restTemplate.exchange(
                "/api/trucks",
                HttpMethod.POST,
                requestEntity,
                Truck.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCapacity()).isEqualTo(15);
    }

    @Test
    void loadBikeOntoTruck_ReturnsNotFound_WhenTruckNotExists() {
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trucks/9999/load/1",
                HttpMethod.POST,
                createEntity(),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void unloadBikeFromTruckToStation_ReturnsNotFound_WhenTruckNotExists() {
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/trucks/9999/unload/1/station/1",
                HttpMethod.POST,
                createEntity(),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}