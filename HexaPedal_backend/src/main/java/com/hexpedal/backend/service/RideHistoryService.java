package com.hexpedal.backend.service;


import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.repository.RidesRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class RideHistoryService {

    private final RidesRepository ridesRepo;

    public List<Rides> getRidesByUserId(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        return ridesRepo.findByUserId(userId);
    }
}
