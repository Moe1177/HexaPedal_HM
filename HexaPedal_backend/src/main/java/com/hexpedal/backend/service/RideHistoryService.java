package com.hexpedal.backend.service;


import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.repository.RidesRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
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

    public List<Rides> getAllRides() {
        return ridesRepo.findAll().stream()
                .sorted((r1, r2) -> {
                    Instant ts1 = r1.getStartTimestamp();
                    Instant ts2 = r2.getStartTimestamp();
                    
                   
                    if (ts1 == null && ts2 == null) {
                        return 0;
                    }
                    if (ts1 == null) {
                        return 1; 
                    }
                    if (ts2 == null) {
                        return -1;
                    }
                    
                 
                    return ts2.compareTo(ts1);
                })
                .toList();
    }
}
