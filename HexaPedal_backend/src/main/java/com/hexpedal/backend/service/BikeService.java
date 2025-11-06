package com.hexpedal.backend.service;

import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.repository.BikeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BikeService {

    private final BikeRepository bikeRepo;

    @Transactional
    public Bike updateStatus(Integer bikeId, BikeStatus status) {
        var bike = bikeRepo.findById(bikeId)
                .orElseThrow(() -> new EntityNotFoundException("Bike not found: " + bikeId));

        bike.setBikeStatus(status);

        if (status == BikeStatus.maintenance) {
            bike.setCurrentUser(null);
            bike.setReservationExpDate(null);
            bike.setReservationExpTime(null);
        }

        return bikeRepo.save(bike);
    }
}
