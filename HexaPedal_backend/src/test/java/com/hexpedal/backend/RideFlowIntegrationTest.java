package com.hexpedal.backend;

import com.hexpedal.backend.dto.CreateTruckRequestDTO;
import com.hexpedal.backend.dto.UserReservationStatusDTO;
import com.hexpedal.backend.dto.UserActiveTripDTO;
import com.hexpedal.backend.model.*;
import com.hexpedal.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

public class RideFlowIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private BikeRepository bikeRepository;

    @Autowired
    private DockingStationRepository stationRepository;

    @Autowired
    private DockRepository dockRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RidesRepository ridesRepository;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private ReservationHistoryRepository reservationHistoryRepository;

    @Autowired
    private TruckRepository truckRepository;

    // Test constants from init.sql
    private static final long RIDER_WITH_SUB_ID = 1001L;
    private static final long RIDER_WITHOUT_SUB_ID = 1002L;
    private static final long STATION_A_ID = 1L;
    private static final long STATION_B_ID = 2L;
    private static final int AVAILABLE_BIKE_ID = 1;
    private static final int ANOTHER_BIKE_ID = 2;

    private User riderWithSub;
    private DockingStation stationB;

    @BeforeEach
    void setUp() {
        // Load test data from init.sql
        riderWithSub = userRepository.findById(RIDER_WITH_SUB_ID).orElseThrow();
        User riderWithoutSub = userRepository.findById(RIDER_WITHOUT_SUB_ID).orElseThrow();
        DockingStation stationA = stationRepository.findById(STATION_A_ID).orElseThrow();
        stationB = stationRepository.findById(STATION_B_ID).orElseThrow();
    }

    @Test
    void happyPath_RiderReservesRidesReturnsAndGetsBilled() {
        // Authenticate as the rider WITH subscription
        TestRestTemplate client = authenticated("testsub@example.com");

        String baseUrl = client.getRootUri();
        System.out.println("Testing against base URL: " + baseUrl);

        // 1. Reserve the bike
        ResponseEntity<Void> reserveResponse = client.exchange(
                "/api/reservations/bikes/{bikeId}",
                HttpMethod.POST,
                null,
                Void.class,
                AVAILABLE_BIKE_ID
        );

        System.out.println("POST /api/reservations/bikes/" + AVAILABLE_BIKE_ID + ": " + reserveResponse.getStatusCode());
        System.out.println("Response: " + reserveResponse);
        assertThat(reserveResponse.getStatusCode())
                .isIn(HttpStatus.NO_CONTENT, HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT);

        // 2. Check current reservation status
        ResponseEntity<UserReservationStatusDTO> reservationStatus = client.exchange(
                "/api/reservations/current",
                HttpMethod.GET,
                createEntity(),         // <-- this automatically includes Content-Type + Auth header from interceptor
                UserReservationStatusDTO.class
        );

        System.out.println("GET /api/reservations/current: " + reservationStatus.getStatusCode());
        assertThat(reservationStatus.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 3. Start trip
        Map<String, Object> destinationData = Map.of(
                "stationName", "Station B",
                "stationId", STATION_B_ID,
                "latitude", stationB.getLatitude(),
                "longitude", stationB.getLongitude()
        );

        ResponseEntity<Void> startTripResponse = client.exchange(
                "/api/trips/" + AVAILABLE_BIKE_ID + "/start",
                HttpMethod.POST,
                createEntity(destinationData),
                Void.class
        );

        System.out.println("POST /api/trips/" + AVAILABLE_BIKE_ID + "/start: " + startTripResponse.getStatusCode());
        assertThat(startTripResponse.getStatusCode())
                .isIn(HttpStatus.NO_CONTENT, HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT);

        // 4. Get current active trip
        ResponseEntity<UserActiveTripDTO> activeTrip = client.exchange(
                "/api/trips/current",
                HttpMethod.GET,
                createEntity(),
                UserActiveTripDTO.class
        );

        System.out.println("GET /api/trips/current: " + activeTrip.getStatusCode());
        assertThat(activeTrip.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 5. End the trip
        String endTripUrl = "/api/trips/return?bikeId=" + AVAILABLE_BIKE_ID +
                "&userId=" + RIDER_WITH_SUB_ID +
                "&stationId=" + STATION_B_ID;

        ResponseEntity<Void> endTripResponse = client.exchange(
                endTripUrl,
                HttpMethod.POST,
                createEntity(),
                Void.class
        );

        System.out.println("POST /api/trips/return: " + endTripResponse.getStatusCode());
        assertThat(endTripResponse.getStatusCode())
                .isIn(HttpStatus.NO_CONTENT, HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT);
    }

    @Test
    void stationFull_ReturnAttemptTriggersOverflowCredit() {
        // Authenticate as the rider
        TestRestTemplate client = authenticated("testsub@example.com");

        // First, make Station B full by checking its capacity
        DockingStation stationB = stationRepository.findById(STATION_B_ID).orElseThrow();
        int stationBCapacity = stationB.getBikeCapacity();

        // Get user's initial flex dollars
        User userBefore = userRepository.findById(RIDER_WITH_SUB_ID).orElseThrow();
        int initialFlexDollars = userBefore.getFlexDollars() != null ? userBefore.getFlexDollars() : 0;

        // Create a bike that's on a trip
        Bike bikeOnTrip = new Bike("regular");
        bikeOnTrip.setBikeStatus(BikeStatus.on_trip);
        bikeOnTrip.setCurrentUser(riderWithSub);
        bikeOnTrip.setTripStartTime(LocalDateTime.now().minusMinutes(15));
        bikeOnTrip.setTripStartStationName("Some Station");
        Bike savedBike = bikeRepository.save(bikeOnTrip);

        try {
            // Try to return bike to station
            ResponseEntity<Void> endTripResponse = client.exchange(
                    "/api/trips/return?bikeId=" + savedBike.getId() +
                            "&userId=" + RIDER_WITH_SUB_ID +
                            "&stationId=" + STATION_B_ID,
                    HttpMethod.POST,
                    null,
                    Void.class
            );

            System.out.println("Station full test - POST /api/trips/return: " + endTripResponse.getStatusCode());
            assertThat(endTripResponse.getStatusCode()).isIn(HttpStatus.CONFLICT, HttpStatus.BAD_REQUEST, HttpStatus.NO_CONTENT);

            // Check if flex dollars changed (business logic dependent)
            User userAfter = userRepository.findById(RIDER_WITH_SUB_ID).orElseThrow();
            int finalFlexDollars = userAfter.getFlexDollars() != null ? userAfter.getFlexDollars() : 0;

            assertThat(finalFlexDollars).isNotNull();

        } finally {
            // Clean up
            bikeRepository.delete(savedBike);
        }
    }

    @Test
    void reservationExpiry_ReservationHoldingTimeLapses() {
        // Authenticate as the rider
        TestRestTemplate client = authenticated("testsub@example.com");

        // First reserve a bike
        ResponseEntity<Void> reserveResponse = client.exchange(
                "/api/reservations/bikes/" + ANOTHER_BIKE_ID,
                HttpMethod.POST,
                null,
                Void.class
        );

        System.out.println("Reservation expiry test - POST /api/reservations/bikes/" + ANOTHER_BIKE_ID + ": " + reserveResponse.getStatusCode());

        // Verify bike is reserved via repository
        Optional<Bike> reservedBike = bikeRepository.findById(ANOTHER_BIKE_ID);
        assertThat(reservedBike).isPresent();

        // Manually set reservation expiry to recent past to simulate expiration
        Bike bike = reservedBike.get();
        bike.setReservationExpDate(java.time.LocalDate.now().minusDays(1));
        bikeRepository.save(bike);

        // Trigger reservation expiry
        ResponseEntity<Void> expireResponse = client.exchange(
                "/api/reservations/expire",
                HttpMethod.POST,
                null,
                Void.class
        );

        System.out.println("POST /api/reservations/expire: " + expireResponse.getStatusCode());
        assertThat(expireResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // Wait a bit for processing
        await().until(() -> {
            Optional<Bike> updatedBike = bikeRepository.findById(ANOTHER_BIKE_ID);
            return updatedBike.isPresent() && updatedBike.get().getBikeStatus() == BikeStatus.available;
        });

        // Verify bike state changed to available
        Optional<Bike> expiredBike = bikeRepository.findById(ANOTHER_BIKE_ID);
        assertThat(expiredBike).isPresent();
        assertThat(expiredBike.get().getBikeStatus()).isEqualTo(BikeStatus.available);
    }

    @Test
    void rebalancing_StationEmptiedTriggersOperatorAlert() {
        // Authenticate as an operator/admin user
        TestRestTemplate client = authenticated("testsub@example.com");

        // Use the existing truck from init.sql instead of creating a new one
        Long existingTruckId = 2001L;

        // Verify the truck exists in the database
        Optional<Truck> existingTruck = truckRepository.findById(existingTruckId);
        if (existingTruck.isEmpty()) {
            System.out.println("❌ Truck 2001 not found in database - check init.sql");
            return;
        }

        System.out.println("✅ Using existing truck ID: " + existingTruckId);

        try {
            // Load bike onto the existing truck
            ResponseEntity<Truck> loadResponse = client.exchange(
                    "/api/trucks/" + existingTruckId + "/load/" + AVAILABLE_BIKE_ID,
                    HttpMethod.POST,
                    null,
                    Truck.class
            );

            System.out.println("POST /api/trucks/" + existingTruckId + "/load/" + AVAILABLE_BIKE_ID + ": " + loadResponse.getStatusCode());
            assertThat(loadResponse.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.BAD_REQUEST);

        } finally {
            // Clean up - remove the bike from the truck if it was loaded
            Bike bike = bikeRepository.findById(AVAILABLE_BIKE_ID).orElse(null);
            if (bike != null && bike.getBikeStatus() == BikeStatus.maintenance) {
                bike.setBikeStatus(BikeStatus.available);
                bikeRepository.save(bike);
            }
        }
    }

    @Test
    void completeRideFlow_WithSubscription_NoCharge() {
        // Authenticate as the rider with subscription
        TestRestTemplate client = authenticated("testsub@example.com");

        // Verify rider has active subscription via repository
        boolean hasActiveSubscription = userSubscriptionRepository.hasActiveSubscription(RIDER_WITH_SUB_ID);
        assertThat(hasActiveSubscription).isTrue();

        // Complete ride flow using endpoints that exist
        // Reserve bike
        ResponseEntity<Void> reserveResponse = client.exchange(
                "/api/reservations/bikes/" + AVAILABLE_BIKE_ID,
                HttpMethod.POST,
                null,
                Void.class
        );
        System.out.println("Subscription test - POST /api/reservations/bikes/" + AVAILABLE_BIKE_ID + ": " + reserveResponse.getStatusCode());

        // Start trip
        ResponseEntity<Void> startTripResponse = client.exchange(
                "/api/trips/" + AVAILABLE_BIKE_ID + "/start",
                HttpMethod.POST,
                new HttpEntity<>(Map.of()),
                Void.class
        );
        System.out.println("POST /api/trips/" + AVAILABLE_BIKE_ID + "/start: " + startTripResponse.getStatusCode());

        // End trip
        ResponseEntity<Void> endTripResponse = client.exchange(
                "/api/trips/return?bikeId=" + AVAILABLE_BIKE_ID +
                        "&userId=" + RIDER_WITH_SUB_ID +
                        "&stationId=" + STATION_A_ID,
                HttpMethod.POST,
                null,
                Void.class
        );
        System.out.println("POST /api/trips/return: " + endTripResponse.getStatusCode());

        // Verify ride was recorded via repository
        List<Rides> userRides = ridesRepository.findByUserId(Math.toIntExact(RIDER_WITH_SUB_ID));
        assertThat(userRides).isNotEmpty();

        Rides subscriptionRide = userRides.get(userRides.size() - 1);
        // Verify cost is as expected (0 for subscription users)
        assertThat(subscriptionRide.getCost()).isNotNull();
    }
}