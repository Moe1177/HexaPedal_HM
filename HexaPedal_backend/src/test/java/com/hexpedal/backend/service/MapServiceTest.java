package com.hexpedal.backend.service;

import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.model.Map;
import com.hexpedal.backend.model.MapEntity;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MapServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private DockingStationService dockingStationService;

    @Mock
    private Map mapInstance;

    private MockedStatic<Map> mapStaticMock;

    private MapService mapService;

    @BeforeEach
    public void setUp() {
        // Mock the singleton Map.getInstance()
        mapStaticMock = mockStatic(Map.class);
        mapStaticMock.when(Map::getInstance).thenReturn(mapInstance);

        // Prepare test data
        List<DockingStation> dockingStations = new ArrayList<>();
        DockingStation station1 = new DockingStation("Station1", 1.0, 1.0, "Address1", 10);
        DockingStation station2 = new DockingStation("Station2", 2.0, 2.0, "Address2", 15);
        dockingStations.add(station1);
        dockingStations.add(station2);

        List<MapEntity> mapEntities = new ArrayList<>(dockingStations);

        // Mock behavior
        when(dockingStationService.cacheDockingStations()).thenReturn(dockingStations);
        when(mapInstance.getMapEntities()).thenReturn(mapEntities);

        // Create service instance (this will call constructor and init methods)
        mapService = new MapService(messagingTemplate, dockingStationService);
    }

    @AfterEach
    public void tearDown() {
        // Close the static mock to avoid interference with other tests
        if (mapStaticMock != null) {
            mapStaticMock.close();
        }
    }

    @Test
    public void constructor_InitializesMapEntities() {
        // Assert
        verify(dockingStationService, times(1)).cacheDockingStations();
        verify(mapInstance, times(1)).setMapEntities(any());
    }

    @Test
    public void constructor_AttachesListenersToMapEntities() {
        // Arrange - create fresh mocks for this test
        List<DockingStation> stations = new ArrayList<>();
        DockingStation mockStation = mock(DockingStation.class);
        stations.add(mockStation);

        List<MapEntity> entities = new ArrayList<>(stations);

        when(dockingStationService.cacheDockingStations()).thenReturn(stations);
        when(mapInstance.getMapEntities()).thenReturn(entities);

        // Act
        MapService service = new MapService(messagingTemplate, dockingStationService);

        // Assert
        verify(mockStation, times(1)).addListener(service);
    }

    @Test
    public void update_BroadcastsMessageToWebSocketEndpoint() {
        // Arrange
        MapEntity testEntity = new DockingStation("Test", 3.0, 3.0, "Test Address", 5);

        // Act
        mapService.update(testEntity);

        // Assert
        verify(messagingTemplate, times(1)).convertAndSend(
                eq("/bms/live-updates"),
                eq(testEntity)
        );
    }

    @Test
    public void getMapEntities_ReturnsListOfMapEntities() {
        // Arrange
        List<MapEntity> expectedEntities = new ArrayList<>();
        expectedEntities.add(new DockingStation("Station1", 1.0, 1.0, "Address1", 10));
        when(mapInstance.getMapEntities()).thenReturn(expectedEntities);

        // Act
        List<MapEntity> result = mapService.getMapEntities();

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
    }

    @Test
    public void update_CallsConvertAndSendWithCorrectParameters() {
        // Arrange
        DockingStation station = new DockingStation("TestStation", 5.0, 5.0, "Address", 20);

        // Act
        mapService.update(station);

        // Assert
        verify(messagingTemplate).convertAndSend("/bms/live-updates", station);
        verifyNoMoreInteractions(messagingTemplate);
    }

    @Test
    public void constructor_LoadsStationsInCorrectOrder() {
        // Verify that cacheDockingStations is called before setMapEntities
        var inOrder = inOrder(dockingStationService, mapInstance);
        inOrder.verify(dockingStationService).cacheDockingStations();
        inOrder.verify(mapInstance).setMapEntities(any());
    }
}