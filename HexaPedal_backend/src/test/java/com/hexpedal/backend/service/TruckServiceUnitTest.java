package com.hexpedal.backend.service;

import com.hexpedal.backend.dto.CreateTruckRequestDTO;
import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.Dock;
import com.hexpedal.backend.model.DockingStation;
import com.hexpedal.backend.model.Truck;
import com.hexpedal.backend.repository.BikeRepository;
import com.hexpedal.backend.repository.DockRepository;
import com.hexpedal.backend.repository.DockingStationRepository;
import com.hexpedal.backend.repository.TruckRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TruckServiceUnitTest {

    @Mock
    private TruckRepository truckRepository;

    @Mock
    private BikeRepository bikeRepository;

    @Mock
    private DockRepository dockRepository;

    @Mock
    private DockingStationRepository stationRepository;

    @InjectMocks
    private TruckService truckService;

    @Test
    public void getAllTrucks_ReturnsTruckList() {
        // Arrange
        List<Truck> trucks = new ArrayList<>();
        trucks.add(Truck.builder().capacity(5).build());
        trucks.add(Truck.builder().capacity(10).build());

        when(truckRepository.findAll()).thenReturn(trucks);

        // Act
        List<Truck> result = truckService.getAllTrucks();

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        verify(truckRepository, times(1)).findAll();
    }

    @Test
    public void getTruck_ReturnsTruck_WhenTruckExists() {
        // Arrange
        Long truckId = 1L;
        Truck truck = Truck.builder().capacity(5).build();

        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));

        // Act
        Truck result = truckService.getTruck(truckId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(truck);
        verify(truckRepository, times(1)).findById(truckId);
    }

    @Test
    public void getTruck_ThrowsNotFoundException_WhenTruckDoesNotExist() {
        // Arrange
        Long truckId = 999L;
        when(truckRepository.findById(truckId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> truckService.getTruck(truckId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Truck not found: " + truckId);

        verify(truckRepository, times(1)).findById(truckId);
    }

    @Test
    public void createTruck_CreatesTruck_WhenCapacityIsValid() {
        // Arrange
        Truck truck = Truck.builder().capacity(10).build();
        CreateTruckRequestDTO request = new CreateTruckRequestDTO(truck.getCapacity());

        when(truckRepository.save(any(Truck.class))).thenReturn(truck);

        // Act
        Truck result = truckService.createTruck(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getCapacity()).isEqualTo(10);
        verify(truckRepository, times(1)).save(any(Truck.class));
    }

    @Test
    public void createTruck_ThrowsBadRequestException_WhenCapacityIsZero() {
        // Arrange
        CreateTruckRequestDTO request = new CreateTruckRequestDTO(0);

        // Act & Assert
        assertThatThrownBy(() -> truckService.createTruck(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Capacity must be > 0");

        verify(truckRepository, never()).save(any());
    }

    @Test
    public void createTruck_ThrowsBadRequestException_WhenCapacityIsNegative() {
        // Arrange
        CreateTruckRequestDTO request = new CreateTruckRequestDTO(-5);

        // Act & Assert
        assertThatThrownBy(() -> truckService.createTruck(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Capacity must be > 0");

        verify(truckRepository, never()).save(any());
    }

    @Test
    public void loadBikeOntoTruck_LoadsBike_WhenTruckHasSpace() {
        // Arrange
        Long truckId = 1L;
        Integer bikeId = 100;

        Truck truck = Truck.builder().id(truckId).capacity(5).bikes(new ArrayList<>()).build();
        Bike bike = new Bike();
        bike.setId(bikeId);

        Dock dock = new Dock();
        dock.setBike(bike);

        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));
        when(bikeRepository.findById(bikeId)).thenReturn(Optional.of(bike));
        when(dockRepository.findByBike_Id(bikeId)).thenReturn(Optional.of(dock));
        when(dockRepository.save(dock)).thenReturn(dock);
        when(truckRepository.save(truck)).thenReturn(truck);

        // Act
        Truck result = truckService.loadBikeOntoTruck(truckId, bikeId);

        // Assert
        assertThat(result).isNotNull();
        verify(dockRepository).save(dock);
        verify(truckRepository).save(truck);
        assertThat(dock.getBike()).isNull();
    }

    @Test
    public void loadBikeOntoTruck_ThrowsBadRequestException_WhenTruckIsFull() {
        // Arrange
        Long truckId = 1L;
        Integer bikeId = 100;

        Truck truck = mock(Truck.class);
        when(truck.isFull()).thenReturn(true);

        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));

        // Act & Assert
        assertThatThrownBy(() -> truckService.loadBikeOntoTruck(truckId, bikeId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Truck " + truckId + " is already full");

        verify(bikeRepository, never()).findById(any());
    }

    @Test
    public void loadBikeOntoTruck_ThrowsNotFoundException_WhenBikeDoesNotExist() {
        // Arrange
        Long truckId = 1L;
        Integer bikeId = 999;

        Truck truck = Truck.builder().capacity(5).bikes(new ArrayList<>()).build();

        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));
        when(bikeRepository.findById(bikeId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> truckService.loadBikeOntoTruck(truckId, bikeId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Bike not found: " + bikeId);

        verify(dockRepository, never()).findByBike_Id(any());
    }

    @Test
    public void loadBikeOntoTruck_ThrowsBadRequestException_WhenBikeIsNotDocked() {
        // Arrange
        Long truckId = 1L;
        Integer bikeId = 100;

        Truck truck = Truck.builder().capacity(5).bikes(new ArrayList<>()).build();
        Bike bike = new Bike();
        bike.setId(bikeId);

        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));
        when(bikeRepository.findById(bikeId)).thenReturn(Optional.of(bike));
        when(dockRepository.findByBike_Id(bikeId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> truckService.loadBikeOntoTruck(truckId, bikeId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Bike " + bikeId + " is not currently docked in a station");

        verify(dockRepository, never()).save(any());
    }

    @Test
    public void unloadBikeFromTruckToStation_UnloadsBike_WhenDockIsAvailable() {
        // Arrange
        Long truckId = 1L;
        Integer bikeId = 100;
        Long stationId = 5L;

        Bike bike = new Bike();
        bike.setId(bikeId);

        List<Bike> bikes = new ArrayList<>();
        bikes.add(bike);

        Truck truck = Truck.builder().capacity(5).build();
        truck.setBikes(bikes);

        DockingStation station = new DockingStation();
        Dock emptyDock = new Dock();

        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));
        when(stationRepository.findById(stationId)).thenReturn(Optional.of(station));
        when(dockRepository.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(stationId))
                .thenReturn(Optional.of(emptyDock));
        when(truckRepository.save(truck)).thenReturn(truck);

        // Act
        Truck result = truckService.unloadBikeFromTruckToStation(truckId, bikeId, stationId);

        // Assert
        assertThat(result).isNotNull();
        verify(dockRepository).save(emptyDock);
        verify(truckRepository).save(truck);
        assertThat(emptyDock.getBike()).isEqualTo(bike);
    }

    @Test
    public void unloadBikeFromTruckToStation_ThrowsBadRequestException_WhenBikeNotOnTruck() {
        // Arrange
        Long truckId = 1L;
        Integer bikeId = 100;
        Long stationId = 5L;

        Truck truck = Truck.builder().capacity(5).build();
        truck.setBikes(new ArrayList<>());

        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));

        // Act & Assert
        assertThatThrownBy(() -> truckService.unloadBikeFromTruckToStation(truckId, bikeId, stationId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Bike " + bikeId + " is not on truck " + truckId);

        verify(stationRepository, never()).findById(any());
    }

    @Test
    public void unloadBikeFromTruckToStation_ThrowsNotFoundException_WhenStationDoesNotExist() {
        // Arrange
        Long truckId = 1L;
        Integer bikeId = 100;
        Long stationId = 999L;

        Bike bike = new Bike();
        bike.setId(bikeId);

        List<Bike> bikes = new ArrayList<>();
        bikes.add(bike);

        Truck truck = Truck.builder().capacity(5).build();
        truck.setBikes(bikes);

        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));
        when(stationRepository.findById(stationId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> truckService.unloadBikeFromTruckToStation(truckId, bikeId, stationId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Station not found: " + stationId);

        verify(dockRepository, never()).findFirstByStation_IdAndBikeIsNullOrderByIdAsc(any());
    }

    @Test
    public void unloadBikeFromTruckToStation_ThrowsBadRequestException_WhenNoEmptyDockAvailable() {
        // Arrange
        Long truckId = 1L;
        Integer bikeId = 100;
        Long stationId = 5L;

        Bike bike = new Bike();
        bike.setId(bikeId);

        List<Bike> bikes = new ArrayList<>();
        bikes.add(bike);

        Truck truck = Truck.builder().capacity(5).build();
        truck.setBikes(bikes);

        DockingStation station = new DockingStation();

        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));
        when(stationRepository.findById(stationId)).thenReturn(Optional.of(station));
        when(dockRepository.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(stationId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> truckService.unloadBikeFromTruckToStation(truckId, bikeId, stationId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("No empty dock available at station " + stationId);

        verify(dockRepository, never()).save(any());
    }
}