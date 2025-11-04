package com.hexpedal.backend.service;

import java.time.LocalDateTime;
import com.hexpedal.backend.repository.DockRepository;
import com.hexpedal.backend.repository.DockingStationRepository;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.repository.UserRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.repository.BikeRepository;
import jakarta.persistence.EntityNotFoundException;

@Service
public class ReservationService {
    private static final int HOLD_MINUTES = 10; 
    private final UserRepository userRepo;
    private final BikeRepository bikeRepo;
    private final DockRepository dockRepo;
    private final DockingStationRepository dockstationRepo;
    private final RidesRepository ridesRepo;
    

    public ReservationService(UserRepository userRepo, BikeRepository bikeRepo, DockRepository dockRepo, DockingStationRepository dockstationRepo, RidesRepository ridesRepo) {
        this.userRepo = userRepo;
        this.bikeRepo = bikeRepo;
        this.dockRepo = dockRepo;
        this.dockstationRepo = dockstationRepo;
        this.ridesRepo = ridesRepo;
    }

    public void reserveBike(String email, Integer bikeId) {
   
        var user = userRepo.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("User not found: " + email));


        if (bikeRepo.existsByCurrentUserAndBikeStatus(user, BikeStatus.reserved)) {
            throw new IllegalStateException("User already has a reserved bike.");
        }
        if (bikeRepo.existsByCurrentUserAndBikeStatus(user, BikeStatus.on_trip)) {
            throw new IllegalStateException("User is already on a trip.");
        }


        var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.available).orElseThrow(() -> new IllegalStateException("Bike is not available for reservation."));

        dockRepo.findByBike_Id(bike.getId()).orElseThrow(() -> new IllegalStateException("Bike must be docked to be reserved."));

       
        bike.setBikeStatus(BikeStatus.reserved);
        bike.setCurrentUser(user);
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(HOLD_MINUTES);
        bike.setReservationExpDate(expiry.toLocalDate());
        bike.setReservationExpTime(expiry.toLocalTime());

        
        bikeRepo.save(bike);
    }

    public void cancelReservation(String email, Integer bikeId) {
        var user = userRepo.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.reserved).orElseThrow(() -> new IllegalStateException("Bike is not reserved."));
        if (bike.getCurrentUser().getId() != user.getId()) {
            throw new IllegalStateException("Bike is reserved by another user.");
        }
        bike.setBikeStatus(BikeStatus.available);
        bike.setCurrentUser(null);
        bike.setReservationExpDate(null);
        bike.setReservationExpTime(null);
        bikeRepo.save(bike);
    }
    public void startTrip(Integer bikeId, Long userId){
        var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.reserved)
                .orElseThrow(() -> new IllegalStateException("Bike is not reserved."));
       
        if (bike.getCurrentUser().getId() != userId) {
            throw new IllegalStateException("Bike is reserved by another user.");
        }
    
        var dock = dockRepo.findByBike_Id(bikeId)
                .orElseThrow(() -> new IllegalStateException("Bike is not docked."));
    
        Long stationId = dock.getStation().getId(); 
        var station = dockstationRepo.findById(stationId)
                        .orElseThrow(() -> new EntityNotFoundException("Station not found for dock " + dock.getId()));
            
        String startStationName = station.getName();
    
        dock.setBike(null);
        dockRepo.save(dock);
    
        bike.setBikeStatus(BikeStatus.on_trip);
        bike.setReservationExpDate(null);
        bike.setReservationExpTime(null);

        bike.setTripStartTime(LocalDateTime.now());
        bike.setTripStartStationName(startStationName);
    
        bikeRepo.save(bike);
    }
    public void endTrip(Integer bikeId, Long userId, Long stationId){
        var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.on_trip)
                .orElseThrow(() -> new IllegalStateException("Bike is not on trip."));
        var station = dockstationRepo.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Station not found: " + stationId));
        if (bike.getCurrentUser().getId() != userId) {
            throw new IllegalStateException("Bike is on trip by another user.");
        }
        if (station.getNumberOfBikesDocked() >= station.getBikeCapacity()) {
            throw new IllegalStateException("No empty dock available at this station.");
        }
    
        var emptyDock = dockRepo.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(stationId)
                .orElseThrow(() -> new IllegalStateException("No empty dock available at this station."));
        emptyDock.setBike(bike);
        dockRepo.save(emptyDock);
        bike.setBikeStatus(BikeStatus.available);
        bike.setCurrentUser(null);
        bikeRepo.save(bike);
    
    
        LocalDateTime startTime = bike.getTripStartTime();
        LocalDateTime endTime = LocalDateTime.now();
    
        float durationMinutes = 0f;
        if (startTime != null) {
            long seconds = Duration.between(startTime, endTime).getSeconds();
            durationMinutes = seconds / 60.0f;
        }
    
        String startLocation = bike.getTripStartStationName() != null
                ? bike.getTripStartStationName()
                : "Unknown";
    
        String endLocation = station.getName(); 
    
        float distanceKm = 0f; 
    
        Rides ride = new Rides(
                userId.intValue(),   
                startLocation,
                endLocation,
                durationMinutes,
                distanceKm
        );
      
        ridesRepo.save(ride);
    
     
        bike.setTripStartTime(null);
        bike.setTripStartStationName(null);
        bikeRepo.save(bike);
    }
    public void expireReservations(){
        var now = LocalDateTime.now();
        var bikes = bikeRepo.findByBikeStatus(BikeStatus.reserved);
        for (var bike : bikes) {
            if (bike.getReservationExpDate() == null || bike.getReservationExpTime() == null) {
                continue;
            }
            var expiry = LocalDateTime.of(bike.getReservationExpDate(), bike.getReservationExpTime());
            if (now.isAfter(expiry)) {
                bike.setBikeStatus(BikeStatus.available);
                bike.setCurrentUser(null);
                bike.setReservationExpDate(null);
                bike.setReservationExpTime(null);
                bikeRepo.save(bike);
            }
        }
    }

}
