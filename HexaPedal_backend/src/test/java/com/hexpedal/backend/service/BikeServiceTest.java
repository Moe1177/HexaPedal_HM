package com.hexpedal.backend.service;

import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.repository.BikeRepository;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BikeServiceTest {
    @Mock
    private BikeRepository bikeRepo;

    @InjectMocks
    private BikeService bikeService;


    @Test
    public void updateStatus_ReturnsBike() {
        Bike testBike = new Bike();
        testBike.setId(1);
        testBike.setBikeStatus(BikeStatus.available);

        when(bikeRepo.findById(1)).thenReturn(Optional.of(testBike));
        when(bikeRepo.save(testBike)).thenReturn(testBike);

        bikeService.updateStatus(1, BikeStatus.on_trip);

        Assertions.assertThat(testBike.getBikeStatus()).isEqualTo(BikeStatus.on_trip);
    }
}
