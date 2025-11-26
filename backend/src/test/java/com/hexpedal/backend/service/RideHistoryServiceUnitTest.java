package com.hexpedal.backend.service;

import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.repository.RidesRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RideHistoryServiceUnitTest {
    @Mock
    private RidesRepository ridesRepo;

    @InjectMocks
    private RideHistoryService rideHistoryService;

    @Test
    public void getRidesByUserId_ReturnsRideHistory() {
        // Arrange
        Integer userId = 1;
        List<Rides> expectedRides = new ArrayList<>();
        Rides ride1 = new Rides();
        Rides ride2 = new Rides();
        expectedRides.add(ride1);
        expectedRides.add(ride2);

        when(ridesRepo.findByUserId(userId)).thenReturn(expectedRides);

        // Act
        List<Rides> result = rideHistoryService.getRidesByUserId(userId);

        // Assert
        assertThat(result).isEqualTo(expectedRides);
    }

    @Test
    public void getRidesByUserId_ReturnsEmptyList_WhenNoRidesFound() {
        // Arrange
        Integer userId = 2;
        List<Rides> emptyRides = new ArrayList<>();

        when(ridesRepo.findByUserId(userId)).thenReturn(emptyRides);

        // Act
        List<Rides> result = rideHistoryService.getRidesByUserId(userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
    }

    @Test
    public void getRidesByUserId_ThrowsIllegalArgumentException_WhenUserIdIsNull() {
        // Act & Assert
        assertThatThrownBy(() -> rideHistoryService.getRidesByUserId(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User ID cannot be null");

        verify(ridesRepo, never()).findByUserId(any());
    }

    @Test
    public void getRidesByUserId_CallsRepositoryWithCorrectUserId() {
        // Arrange
        Integer userId = 5;
        when(ridesRepo.findByUserId(userId)).thenReturn(new ArrayList<>());

        // Act
        rideHistoryService.getRidesByUserId(userId);

        // Assert
        verify(ridesRepo).findByUserId(userId);
        verifyNoMoreInteractions(ridesRepo);
    }
}