package com.hexpedal.backend.controller;

import com.hexpedal.backend.BaseIntegrationTest;
import com.hexpedal.backend.dto.CreateStationRequestDTO;
import com.hexpedal.backend.dto.UpdateStationStateDTO;
import com.hexpedal.backend.dto.UpdateStationPositionDTO;
import com.hexpedal.backend.dto.DockDTO;
import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.model.DockingStationStates;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

public class DockingStationControllerIntegrationTest extends BaseIntegrationTest {

    // Station IDs from init.sql
    private static final long STATION_A_ID = 1L;  // Has bikes 1,2,3 and one empty dock
    private static final long STATION_B_ID = 2L;  // Has bikes 4,5

    @Test
    void getAllStations_ReturnsListOfStations() {
        HttpEntity<Void> requestEntity = createEntity();

        ResponseEntity<DockingStation[]> response = restTemplate.exchange(
                "/api/stations",
                HttpMethod.GET,
                requestEntity,
                DockingStation[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().length).isGreaterThanOrEqualTo(2);
    }

    @Test
    void createStation_ReturnsConflict_WhenStationExistsAtCoordinates() {
        // Try to create station at same coordinates as Station A (from init.sql)
        CreateStationRequestDTO duplicateRequest = new CreateStationRequestDTO(
                "Duplicate Station",
                "Duplicate Address",
                10,
                45.5017,  // Same as Station A
                -73.5673  // Same as Station A
        );

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations",
                HttpMethod.POST,
                createEntity(duplicateRequest),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void updateState_ReturnsUpdatedStation() {
        UpdateStationStateDTO stateUpdate = new UpdateStationStateDTO();
        stateUpdate.setState(DockingStationStates.active);

        ResponseEntity<DockingStation> response = restTemplate.exchange(
                "/api/stations/" + STATION_A_ID + "/state",
                HttpMethod.PATCH,
                createEntity(stateUpdate),
                DockingStation.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(DockingStationStates.active);
    }

    @Test
    void updateState_ReturnsNotFound_WhenStationNotExists() {
        UpdateStationStateDTO stateUpdate = new UpdateStationStateDTO();
        stateUpdate.setState(DockingStationStates.active);

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations/9999/state",
                HttpMethod.PATCH,
                createEntity(stateUpdate),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateState_ReturnsConflict_WhenSettingOutOfServiceWithBikesDocked() {
        // Station A has bikes docked
        UpdateStationStateDTO stateUpdate = new UpdateStationStateDTO();
        stateUpdate.setState(DockingStationStates.out_of_service);

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations/" + STATION_A_ID + "/state",
                HttpMethod.PATCH,
                createEntity(stateUpdate),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void updatePosition_ReturnsNotFound_WhenStationNotExists() {
        UpdateStationPositionDTO positionUpdate = new UpdateStationPositionDTO();
        positionUpdate.setLatitude(48.0);
        positionUpdate.setLongitude(-76.0);

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations/9999/position",
                HttpMethod.PATCH,
                createEntity(positionUpdate),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updatePosition_ReturnsConflict_WhenCoordinatesAlreadyExist() {
        // Try to move Station B to Station A's coordinates
        UpdateStationPositionDTO positionUpdate = new UpdateStationPositionDTO();
        positionUpdate.setLatitude(45.5017);  // Station A's coordinates
        positionUpdate.setLongitude(-73.5673);

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations/" + STATION_B_ID + "/position",
                HttpMethod.PATCH,
                createEntity(positionUpdate),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void updatePosition_ReturnsConflict_WhenBikesAreDocked() {
        // Station A has bikes docked, so position change should fail
        UpdateStationPositionDTO positionUpdate = new UpdateStationPositionDTO();
        positionUpdate.setLatitude(99.0);
        positionUpdate.setLongitude(-99.0);

        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations/" + STATION_A_ID + "/position",
                HttpMethod.PATCH,
                createEntity(positionUpdate),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void deleteStation_ReturnsNotFound_WhenStationNotExists() {
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations/9999",
                HttpMethod.DELETE,
                createEntity(),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void deleteStation_ReturnsConflict_WhenBikesAreDocked() {
        // Station A has bikes docked
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations/" + STATION_A_ID,
                HttpMethod.DELETE,
                createEntity(),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void getBikesForStation_ReturnsNotFound_WhenStationNotExists() {
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations/9999/bikes",
                HttpMethod.GET,
                createEntity(),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getBikesForStation_ReturnsBikes_WhenBikesDocked() {
        // Station A has bikes 1, 2, 3 docked (from init.sql)
        ResponseEntity<Bike[]> response = restTemplate.exchange(
                "/api/stations/" + STATION_A_ID + "/bikes",
                HttpMethod.GET,
                createEntity(),
                Bike[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().length).isEqualTo(3);
    }

    @Test
    void getAvailableDocks_ReturnsInternalServerError_WhenStationNotExists() {
        // Note: Controller uses EntityNotFoundException which returns 500
        // Consider changing to ResponseStatusException for proper 404
        ResponseEntity<Void> response = restTemplate.exchange(
                "/api/stations/9999/docks/available",
                HttpMethod.GET,
                createEntity(),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void getAvailableDocks_ReturnsDocks_WhenStationExists() {
        // Station A has 1 empty dock (dock id 6 with bike_id NULL from init.sql)
        ResponseEntity<DockDTO[]> response = restTemplate.exchange(
                "/api/stations/" + STATION_A_ID + "/docks/available",
                HttpMethod.GET,
                createEntity(),
                DockDTO[].class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().length).isEqualTo(1);
    }
}