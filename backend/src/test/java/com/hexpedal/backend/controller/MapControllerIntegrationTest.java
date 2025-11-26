package com.hexpedal.backend.controller;

import com.hexpedal.backend.BaseIntegrationTest;
import com.hexpedal.backend.model.MapEntity;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

public class MapControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void getMapEntities_ReturnsListOfMapEntities() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<MapEntity[]> response = restTemplate.exchange(
                "/api/map/init-map-entities",
                HttpMethod.GET,
                requestEntity,
                MapEntity[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isInstanceOf(MapEntity[].class);
    }

    @Test
    void getMapEntities_ReturnsNonEmptyList_WhenStationsExist() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<MapEntity[]> response = restTemplate.exchange(
                "/api/map/init-map-entities",
                HttpMethod.GET,
                requestEntity,
                MapEntity[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        // init.sql has 2 stations, so we should have at least 2 map entities
        assertThat(response.getBody().length).isGreaterThanOrEqualTo(2);
    }
}