package com.hexpedal.backend.service;

import java.time.LocalDateTime;

import com.hexpedal.backend.repository.DockRepository;
import com.hexpedal.backend.repository.DockingStationRepository;
import com.hexpedal.backend.repository.RidesRepository;
import com.hexpedal.backend.repository.UserRepository;
import com.hexpedal.backend.repository.UserSubscriptionRepository;
import java.util.Objects;
import java.util.Map;
import java.time.ZoneId;
import java.time.Instant;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;


import com.hexpedal.backend.model.Bike;
import com.hexpedal.backend.model.BikeStatus;
import com.hexpedal.backend.model.DockingStationStates;
import com.hexpedal.backend.model.Rides;
import com.hexpedal.backend.model.ReservationHistory;
import com.hexpedal.backend.model.ReservationOutcome;
import com.hexpedal.backend.repository.BikeRepository;

import com.hexpedal.backend.repository.ReservationHistoryRepository;
import com.hexpedal.backend.dto.UserReservationStatusDTO;
import com.hexpedal.backend.dto.UserActiveTripDTO;
import jakarta.persistence.EntityNotFoundException;

@Service
@AllArgsConstructor
public class ReservationService {
    //private static final int HOLD_MINUTES = 10;
    private final UserRepository userRepo;
    private final BikeRepository bikeRepo;
    private final DockRepository dockRepo;
    private final DockingStationRepository dockstationRepo;
    private final RidesRepository ridesRepo;
    private final BillingService billingService;
    private final PaymentService paymentService;
    private final LoyaltyService loyaltyService;
    private final FlexDollarService flexdollarservice;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final ReservationHistoryRepository reservationHistoryRepo;

    public void reserveBike(String email, Integer bikeId) {

        var user = userRepo.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        if (bikeRepo.existsByCurrentUserAndBikeStatus(user, BikeStatus.reserved)) {
            throw new IllegalStateException("User already has a reserved bike.");
        }
        if (bikeRepo.existsByCurrentUserAndBikeStatus(user, BikeStatus.on_trip)) {
            throw new IllegalStateException("User is already on a trip.");
        }

        var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.available).orElseThrow(() -> new IllegalStateException("Bike is not available for reservation."));

        var dock = dockRepo.findByBike_Id(bike.getId()).orElseThrow(() -> new IllegalStateException("Bike must be docked to be reserved."));

        // Check if the station is out of service
        var station = dock.getStation();
        if (station != null && station.getStatus() == DockingStationStates.out_of_service) {
            throw new IllegalStateException("Cannot reserve bike from a station that is out of service.");
        }

        int holdMinutes = loyaltyService.getReservationHoldMinutes(user.getId());

        bike.setBikeStatus(BikeStatus.reserved);
        bike.setCurrentUser(user);
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(holdMinutes);
        bike.setReservationExpDate(expiry.toLocalDate());
        bike.setReservationExpTime(expiry.toLocalTime());

        bikeRepo.save(bike);

        // Create reservation history record
        Instant now = Instant.now();
        Instant expiryInstant = expiry.atZone(ZoneId.systemDefault()).toInstant();
        ReservationHistory history = ReservationHistory.builder()
                .rider(user)
                .bike(bike)
                .reservationCreatedAt(now)
                .reservationExpiryAt(expiryInstant)
                .outcome(ReservationOutcome.PENDING)
                .build();
        reservationHistoryRepo.save(history);

        loyaltyService.evaluateTier(user.getId());
    }

    public void cancelReservation(String email, Integer bikeId) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        var bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.reserved)
                .orElseThrow(() -> new IllegalStateException("Bike is not reserved."));

        if (!Objects.equals(bike.getCurrentUser().getId(), user.getId())) {
            throw new IllegalStateException("Bike is reserved by another user.");
        }

        // Update reservation history to CANCELLED
        reservationHistoryRepo.findMostRecentPendingReservation(user.getId(), bikeId)
                .ifPresent(history -> {
                    history.updateOutcome(ReservationOutcome.CANCELLED);
                    reservationHistoryRepo.save(history);
                });

        bike.setBikeStatus(BikeStatus.available);
        bike.setCurrentUser(null);
        bike.setReservationExpDate(null);
        bike.setReservationExpTime(null);

        bikeRepo.save(bike);
    }

    public void startTrip(Integer bikeId, String email, Map<String, Object> destinationData){
        var user = userRepo.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        
        Bike bike;
        boolean hadReservation = false;
        
        // Try to find reserved bike first (for both guest and registered users)
        var reservedBike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.reserved);
        
        if (reservedBike.isPresent()) {
            bike = reservedBike.get();
            if (!Objects.equals(bike.getCurrentUser().getEmail(), email)) {
                throw new IllegalStateException("Bike is reserved by another user.");
            }
            hadReservation = true;
        } else {
            // No reservation - allow direct start from available bike
            bike = bikeRepo.findByIdAndBikeStatus(bikeId, BikeStatus.available)
                    .orElseThrow(() -> new IllegalStateException("Bike is not available. It may be reserved by another user or already in use."));
            hadReservation = false;
        }
        // Update reservation history to CLAIMED (only if there was a reservation)
        if (hadReservation && (user.getIsGuest() == null || !user.getIsGuest())) {
            reservationHistoryRepo.findMostRecentPendingReservation(user.getId(), bikeId)
                    .ifPresent(history -> {
                        history.updateOutcome(ReservationOutcome.CLAIMED);
                        reservationHistoryRepo.save(history);
                    });
        }

        var dock = dockRepo.findByBike_Id(bikeId)
                .orElseThrow(() -> new IllegalStateException("Bike is not docked."));

        Long stationId = dock.getStation().getId();
        var station = dockstationRepo.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Station not found for dock " + dock.getId()));

        // Check if the station is out of service
        if (station.getStatus() == DockingStationStates.out_of_service) {
            throw new IllegalStateException("Cannot start trip from a station that is out of service.");
        }

        String startStationName = station.getName();

        dock.setBike(null);
        dockRepo.save(dock);

        bike.setBikeStatus(BikeStatus.on_trip);
        bike.setCurrentUser(user); 
        bike.setReservationExpDate(null);
        bike.setReservationExpTime(null);

        bike.setTripStartTime(LocalDateTime.now());
        bike.setTripStartStationName(startStationName);

        // Store destination information if provided
        if (destinationData != null && !destinationData.isEmpty()) {
            bike.setTripDestinationStationName((String) destinationData.get("stationName"));
            bike.setTripDestinationStationId(((Number) destinationData.get("stationId")).longValue());
            bike.setTripDestinationLatitude(((Number) destinationData.get("latitude")).doubleValue());
            bike.setTripDestinationLongitude(((Number) destinationData.get("longitude")).doubleValue());
        }

        bikeRepo.save(bike);
    }

    public void endTrip(Integer bikeId, Long userId, Long stationId){
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
        double distanceKm = 0.0d;

        String bikeType = bike.getType();
        double cost = billingService.calculateTripCost(userId, bikeType, durationMinutes);

        // Apply flex dollars to reduce the cost before charging
        int flexDollarsUsed = 0;
        double finalCostToCharge = cost;

        if (cost > 0) {
            // Apply flex dollars to the trip cost
            FlexDollarService.AppliedFlexDollarsResult flexResult =
                    flexdollarservice.applyFlexDollarsToTrip(userId, cost);
            flexDollarsUsed = flexResult.getFlexDollarsUsed();
            finalCostToCharge = flexResult.getFinalCostToCharge();

            if (flexDollarsUsed > 0) {
                System.out.println("💰 Applied " + flexDollarsUsed + " flex dollars to trip #" +
                        " (reduced cost from $" + String.format("%.2f", cost) +
                        " to $" + String.format("%.2f", finalCostToCharge) + ")");
            }
        }

        // create and save ride (R-PRC-04: maintain log of all trips and charges)
        // Save the final cost (after flex dollars) as this is what the user actually paid
        Rides ride = new Rides();
        ride.setUser(user);
        ride.setBike(bike);
        ride.setStartLocation(startLocation);
        ride.setEndLocation(endLocation);
        ride.setStartTimestamp(startTs);
        ride.setEndTimestamp(endTs);
        ride.setDuration(durationMinutes);
        ride.setDistance(distanceKm);
        ride.setCost(finalCostToCharge); // Save final cost after flex dollars
        ride.setFlexDollarsUsed(flexDollarsUsed);
        ridesRepo.save(ride);

        // Check subscription status to determine proper messaging
        boolean hasActiveSubscription = userSubscriptionRepository.hasActiveSubscription(userId);

        // Automatically charge payment if finalCostToCharge > 0 (after flex dollars applied)
        if (finalCostToCharge > 0) {
            try {
                paymentService.chargeForTrip(
                        userId,
                        finalCostToCharge,
                        String.format("Bike trip #%d: %s to %s (%.1f minutes)",
                                ride.getRide_id(), startLocation, endLocation, durationMinutes)
                );
                System.out.println("💳 Charged $" + String.format("%.2f", finalCostToCharge) + " CAD for trip #" + ride.getRide_id());
            } catch (Exception e) {
                System.err.println("⚠️ Failed to charge for trip #" + ride.getRide_id() + ": " + e.getMessage());
            }
        } else {
            // finalCostToCharge is 0 - determine why
            if (hasActiveSubscription && cost == 0) {
                System.out.println("✅ Trip #" + ride.getRide_id() + " covered by active subscription (no charge)");
            } else if (flexDollarsUsed > 0) {
                System.out.println("✅ Trip #" + ride.getRide_id() + " fully covered by flex dollars (no charge)");
            } else if (cost == 0) {
                System.out.println("✅ Trip #" + ride.getRide_id() + " free (very short trip, no charge)");
            } else {
                System.out.println("✅ Trip #" + ride.getRide_id() + " completed (no charge)");
            }
        }

        // reset bike
        bike.setBikeStatus(BikeStatus.available);
        bike.setCurrentUser(null);
        bike.setTripStartTime(null);
        bike.setTripStartStationName(null);
        bike.setTripDestinationStationName(null);
        bike.setTripDestinationStationId(null);
        bike.setTripDestinationLatitude(null);
        bike.setTripDestinationLongitude(null);
        bikeRepo.save(bike);
        
        if (user.getIsGuest() == null || !user.getIsGuest()) {
            loyaltyService.evaluateTier(userId);
            
            // Award flex dollars only if station is less than 25% filled AND user has no active subscription
            if (station.getNumberOfBikesDocked() < station.getBikeCapacity() * 0.25 && !hasActiveSubscription) {
                flexdollarservice.addFlexDollars(user, 5);
            }
        }
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
                var user = bike.getCurrentUser();

                // Update reservation history to EXPIRED
                if (user != null) {
                    reservationHistoryRepo.findMostRecentPendingReservation(user.getId(), bike.getId())
                            .ifPresent(history -> {
                                history.updateOutcome(ReservationOutcome.EXPIRED);
                                reservationHistoryRepo.save(history);
                            });
                }

                bike.setBikeStatus(BikeStatus.available);
                bike.setCurrentUser(null);
                bike.setReservationExpDate(null);
                bike.setReservationExpTime(null);
                bikeRepo.save(bike);
            }
        }
    }


    public UserReservationStatusDTO getCurrentUserReservation(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        // Find bike reserved by this user
        var reservedBike = bikeRepo.findByCurrentUserAndBikeStatus(user, BikeStatus.reserved);

        if (reservedBike.isEmpty()) {
            return new UserReservationStatusDTO(false, null, null, null, null);
        }

        var bike = reservedBike.get();
        var dock = dockRepo.findByBike_Id(bike.getId());
        String stationName = dock.map(d -> d.getStation().getName()).orElse(null);
        LocalDateTime expiry = LocalDateTime.of(
                bike.getReservationExpDate(),
                bike.getReservationExpTime()
        );

        return new UserReservationStatusDTO(
                true,
                bike.getId(),
                bike.getType(),
                stationName,
                expiry
        );
    }

    public UserActiveTripDTO getCurrentUserTrip(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        // Find bike on trip by this user
        var activeBike = bikeRepo.findByCurrentUserAndBikeStatus(user, BikeStatus.on_trip);

        if (activeBike.isEmpty()) {
            return new UserActiveTripDTO(false, null, null, null, null, null, null, null, null, null);
        }

        var bike = activeBike.get();

        return new UserActiveTripDTO(
                true,
                bike.getId(),
                user.getId(),
                bike.getType(),
                bike.getTripStartTime(),
                bike.getTripStartStationName(),
                bike.getTripDestinationStationName(),
                bike.getTripDestinationStationId(),
                bike.getTripDestinationLatitude(),
                bike.getTripDestinationLongitude()
        );
    }
}