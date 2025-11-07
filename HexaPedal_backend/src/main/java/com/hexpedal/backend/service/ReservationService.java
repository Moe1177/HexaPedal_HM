package com.hexpedal.backend.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.hexpedal.backend.dto.TripSummaryDTO;
import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.model.BillingCharge;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.SubscriptionPlan;
import com.hexpedal.backend.repository.BikeRepository;
import com.hexpedal.backend.repository.DockRepository;
import com.hexpedal.backend.repository.DockingStationRepository;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.repository.UserRepository;
import com.stripe.exception.StripeException;

import java.time.Duration;
import org.springframework.stereotype.Service;

import com.hexpedal.backend.dto.UserReservationStatusDTO;

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
    private final PricingCalculationService pricingService;
    private final BillingService billingService;
    

    public ReservationService(UserRepository userRepo, BikeRepository bikeRepo, DockRepository dockRepo, DockingStationRepository dockstationRepo, RidesRepository ridesRepo, PricingCalculationService pricingService, BillingService billingService) {
        this.userRepo = userRepo;
        this.bikeRepo = bikeRepo;
        this.dockRepo = dockRepo;
        this.dockstationRepo = dockstationRepo;
        this.ridesRepo = ridesRepo;
        this.pricingService = pricingService;
        this.billingService = billingService;
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
        var user = userRepo.findByEmail(email)
            .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    
        var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.reserved)
            .orElseThrow(() -> new IllegalStateException("Bike is not reserved."));
    
        if (!Objects.equals(bike.getCurrentUser().getId(), user.getId())) {
            throw new IllegalStateException("Bike is reserved by another user.");
        }
    
        bike.setBikeStatus(BikeStatus.available);
        bike.setCurrentUser(null);
        bike.setReservationExpDate(null);
        bike.setReservationExpTime(null);
    
        bikeRepo.save(bike);
    }
    

    public void startTrip(Integer bikeId, String email){
        var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.reserved)
                .orElseThrow(() -> new IllegalStateException("Bike is not reserved."));
       
        if (!Objects.equals(bike.getCurrentUser().getEmail(), email)) {
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
    public TripSummaryDTO endTrip(Integer bikeId, Long userId, Long stationId) throws StripeException {
        var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.on_trip)
                .orElseThrow(() -> new IllegalStateException("Bike is not on trip."));

        var user = userRepo.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        if (!Objects.equals(bike.getCurrentUser().getId(), userId)) {
            throw new IllegalStateException("Bike is on trip by another user.");
        }

        var station = dockstationRepo.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Station not found: " + stationId));

        if (station.getNumberOfBikesDocked() >= station.getBikeCapacity()) {
            throw new IllegalStateException("No empty dock available at this station.");
        }

        var emptyDock = dockRepo.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(stationId)
                .orElseThrow(() -> new IllegalStateException("No empty dock available at this station."));
        emptyDock.setBike(bike);
        dockRepo.save(emptyDock);

        // compute timings
        LocalDateTime startTimeLdt = bike.getTripStartTime();
        if (startTimeLdt == null) {
            throw new IllegalStateException("Trip start time is missing on bike " + bikeId);
        }
        LocalDateTime endTimeLdt = LocalDateTime.now();

        long seconds = java.time.Duration.between(startTimeLdt, endTimeLdt).getSeconds();
        double durationMinutes = seconds / 60.0d;

        Instant startTs = startTimeLdt.atZone(ZoneId.systemDefault()).toInstant();
        Instant endTs   = endTimeLdt.atZone(ZoneId.systemDefault()).toInstant();

        String startLocation = (bike.getTripStartStationName() != null) ? bike.getTripStartStationName() : "Unknown";
        String endLocation = station.getName();

        // Get user's subscription plan (default to SINGLE_USE)
        SubscriptionPlan plan = billingService.getUserPlan(userId);

        // Calculate cost using pricing service
        PricingCalculationService.TripCostDetails costDetails = 
                pricingService.calculateCost(plan, durationMinutes);

        // create and save ride
        Rides ride = new Rides();
        ride.setUser(user);
        ride.setBikeId(bikeId);
        ride.setStartLocation(startLocation);
        ride.setEndLocation(endLocation);
        ride.setStartTimestamp(startTs);
        ride.setEndTimestamp(endTs);
        ride.setDuration(durationMinutes);
       
        ride.setCost(costDetails.getTotalCost());
        ridesRepo.save(ride);

        // Create billing charge
        BillingCharge charge = billingService.createBillingCharge(
                user, ride, bikeId, plan, durationMinutes);

        // reset bike
        bike.setBikeStatus(BikeStatus.available);
        bike.setCurrentUser(null);
        bike.setTripStartTime(null);
        bike.setTripStartStationName(null);
        bikeRepo.save(bike);

        return new TripSummaryDTO(
                ride.getRide_id(),
                bikeId,
                startLocation,
                endLocation,
                startTs,
                endTs,
                durationMinutes,
                0.0,
                plan.name(),
                new TripSummaryDTO.CostBreakdown(
                        costDetails.getBaseFee(),
                        costDetails.getTimeCharge(),
                        costDetails.getUnlockFee(),
                        costDetails.getTotalCost()
                ),
                charge.getChargeStatus(),
                charge.getStripeChargeId()
        );
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
    

    public UserReservationStatusDTO getCurrentReservationStatus(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    
        var bikes = bikeRepo.findByCurrentUser(user);
        if (bikes.isEmpty()) {
            return new UserReservationStatusDTO(false, null, null, null, null);
        }
    
        var bike = bikes.get(0);
    
        LocalDateTime expiresAt = null;
        if (bike.getReservationExpDate() != null && bike.getReservationExpTime() != null) {
            expiresAt = LocalDateTime.of(
                bike.getReservationExpDate(),
                bike.getReservationExpTime()
            );
        }
    
 
        if (expiresAt != null && expiresAt.isBefore(LocalDateTime.now())) {
            bike.setBikeStatus(BikeStatus.available);
            bike.setCurrentUser(null);
            bike.setReservationExpDate(null);
            bike.setReservationExpTime(null);
            bikeRepo.save(bike);
    
            return new UserReservationStatusDTO(false, null, null, null, null);
        }
    
        
        return new UserReservationStatusDTO(
                true,
                bike.getId(),
                bike.getType(), 
                bike.getTripStartStationName(), 
                expiresAt
        );
    }


        public void startGuestTrip(Integer bikeId) {
            var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.available)
                    .orElseThrow(() -> new IllegalStateException("Bike is not available for a guest trip."));
    
            var dock = dockRepo.findByBike_Id(bikeId)
                    .orElseThrow(() -> new IllegalStateException("Bike is not docked."));
    
            Long stationId = dock.getStation().getId();
            var station = dockstationRepo.findById(stationId)
                    .orElseThrow(() -> new EntityNotFoundException("Station not found for dock " + dock.getId()));
    
            String startStationName = station.getName();
  
            dock.setBike(null);
            dockRepo.save(dock);
    
            bike.setBikeStatus(BikeStatus.on_trip);
            bike.setCurrentUser(null);
            bike.setReservationExpDate(null);
            bike.setReservationExpTime(null);
            bike.setTripStartTime(LocalDateTime.now());
            bike.setTripStartStationName(startStationName);
    
            bikeRepo.save(bike);
        }
    
        public void endGuestTrip(Integer bikeId, Long stationId) {
            var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.on_trip)
                    .orElseThrow(() -> new IllegalStateException("Bike is not on trip."));
    

            if (bike.getCurrentUser() != null) {
                throw new IllegalStateException("This trip belongs to a registered user.");
            }
    
            var station = dockstationRepo.findById(stationId)
                    .orElseThrow(() -> new EntityNotFoundException("Station not found: " + stationId));
    
            if (station.getNumberOfBikesDocked() >= station.getBikeCapacity()) {
                throw new IllegalStateException("No empty dock available at this station.");
            }
    
            var emptyDock = dockRepo.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(stationId)
                    .orElseThrow(() -> new IllegalStateException("No empty dock available at this station."));
    
            emptyDock.setBike(bike);
            dockRepo.save(emptyDock);
    
            bike.setBikeStatus(BikeStatus.available);
            bike.setCurrentUser(null);
            bike.setReservationExpDate(null);
            bike.setReservationExpTime(null);
    
            bikeRepo.save(bike);
        }
    
    



}
