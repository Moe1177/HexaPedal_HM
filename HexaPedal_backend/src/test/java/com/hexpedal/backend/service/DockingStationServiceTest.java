package com.hexpedal.backend.service;

import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.model.DockingStationStates;
import com.hexpedal.backend.repository.DockingStationRepository;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DockingStationServiceTest {

    @Mock
    DockingStationRepository dockingStationRepository;

    @InjectMocks
    private DockingStationService dockingStationService;

    @Test
    public void changeState_ReturnsDockingStation() {
        DockingStation testDockingStation = new DockingStation(
                "Test",
                0.0,
                0.0,
                "Test Address",
                5
        );

        when(dockingStationRepository.findById(1L)).thenReturn(Optional.of(testDockingStation));
        when(dockingStationRepository.save(testDockingStation)).thenReturn(testDockingStation);
        DockingStation result = dockingStationService.changeState(1L, DockingStationStates.out_of_service);

        Assertions.assertThat(result.getStatus()).isEqualTo(DockingStationStates.out_of_service);
    }

    @Test
    public void changePosition_ReturnsDockingStation() {
        DockingStation testDockingStation = new DockingStation(
                "Test",
                0.0,
                0.0,
                "Test Address",
                5
        );

        when(dockingStationRepository.existsByLatitudeAndLongitude(anyDouble(), anyDouble())).thenReturn(false);
        when(dockingStationRepository.findById(1L)).thenReturn(Optional.of(testDockingStation));
        when(dockingStationRepository.save(testDockingStation)).thenReturn(testDockingStation);

        DockingStation result = dockingStationService.changePosition(1L, 1.0, 2.0);

        Assertions.assertThat(result.getLatitude()).isEqualTo(1.0);
        Assertions.assertThat(result.getLongitude()).isEqualTo(2.0);
    }

    @Test
    public void cacheDockingStations_ReturnsDockingStation() {
        List<DockingStation> testDockingStations = new ArrayList<>();
        testDockingStations.add(new DockingStation());

        when(dockingStationRepository.findAll()).thenReturn(testDockingStations);

        List<DockingStation> result = dockingStationService.cacheDockingStations();

        Assertions.assertThat(result).isNotEmpty();
    }
}
