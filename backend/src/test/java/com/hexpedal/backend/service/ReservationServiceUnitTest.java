package com.hexpedal.backend.service;

import com.hexpedal.backend.model.*;
import com.hexpedal.backend.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReservationServiceUnitTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private BikeRepository bikeRepo;

    @Mock
    private DockRepository dockRepo;

    @Mock
    private DockingStationRepository dockstationRepo;

    @Mock
    private RidesRepository ridesRepo;

    @Mock
    private BillingService billingService;

    @Mock
    private PaymentService paymentService;

    @Mock
    private LoyaltyService loyaltyService;

    @Mock
    private FlexDollarService flexdollarservice;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private ReservationHistoryRepository reservationHistoryRepo;

    @InjectMocks
    private ReservationService reservationService;

    private User testUser;
    private Bike testBike;
    private Dock testDock;
    private DockingStation testStation;

    @BeforeEach
    public void setUp() {
        testUser = Rider.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test User")
                .isGuest(false)
                .build();

        testBike = new Bike("Standard");
        testBike.setId(1);
        testBike.setBikeStatus(BikeStatus.available);

        testStation = new DockingStation("Test Station", 45.5017, -73.5673, "123 Test St", 10);
        testStation.setId(1L);
        testStation.setStatus(DockingStationStates.active);

        testDock = new Dock();
        testDock.setId(1);
        testDock.setBike(testBike);
        testDock.setStation(testStation); // FIX: Set the station on the dock
    }

    // Helper method to create a full station
    private DockingStation createFullStation() {
        DockingStation fullStation = new DockingStation("Full Station", 45.5017, -73.5673, "456 Full St", 10);
        fullStation.setId(2L);
        fullStation.setStatus(DockingStationStates.active);
        return fullStation;
    }

    // ========== reserveBike Tests ==========

    @Test
    public void reserveBike_Success_ReservesBikeForUser() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.reserved)).thenReturn(false);
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.on_trip)).thenReturn(false);
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.available)).thenReturn(Optional.of(testBike));
        when(dockRepo.findByBike_Id(1)).thenReturn(Optional.of(testDock));
        when(loyaltyService.getReservationHoldMinutes(1L)).thenReturn(10);
        when(bikeRepo.save(any(Bike.class))).thenReturn(testBike);
        when(reservationHistoryRepo.save(any(ReservationHistory.class))).thenReturn(null);

        // Act
        reservationService.reserveBike("test@example.com", 1);

        // Assert
        assertThat(testBike.getBikeStatus()).isEqualTo(BikeStatus.reserved);
        assertThat(testBike.getCurrentUser()).isEqualTo(testUser);
        assertThat(testBike.getReservationExpDate()).isNotNull();
        assertThat(testBike.getReservationExpTime()).isNotNull();
        verify(bikeRepo).save(testBike);
        verify(reservationHistoryRepo).save(any(ReservationHistory.class));
        verify(loyaltyService).evaluateTier(1L);
    }

    @Test
    public void reserveBike_UserNotFound_ThrowsException() {
        // Arrange
        when(userRepo.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.reserveBike("nonexistent@example.com", 1))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    public void reserveBike_UserAlreadyHasReservation_ThrowsException() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.reserved)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> reservationService.reserveBike("test@example.com", 1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("User already has a reserved bike");
    }

    @Test
    public void reserveBike_UserAlreadyOnTrip_ThrowsException() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.reserved)).thenReturn(false);
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.on_trip)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> reservationService.reserveBike("test@example.com", 1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("User is already on a trip");
    }

    @Test
    public void reserveBike_BikeNotAvailable_ThrowsException() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.reserved)).thenReturn(false);
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.on_trip)).thenReturn(false);
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.available)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.reserveBike("test@example.com", 1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bike is not available for reservation");
    }

    @Test
    public void reserveBike_BikeNotDocked_ThrowsException() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.reserved)).thenReturn(false);
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.on_trip)).thenReturn(false);
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.available)).thenReturn(Optional.of(testBike));
        when(dockRepo.findByBike_Id(1)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.reserveBike("test@example.com", 1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bike must be docked to be reserved");
    }

    @Test
    public void reserveBike_StationOutOfService_ThrowsException() {
        // Arrange
        testStation.setStatus(DockingStationStates.out_of_service);

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.reserved)).thenReturn(false);
        when(bikeRepo.existsByCurrentUserAndBikeStatus(testUser, BikeStatus.on_trip)).thenReturn(false);
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.available)).thenReturn(Optional.of(testBike));
        when(dockRepo.findByBike_Id(1)).thenReturn(Optional.of(testDock));

        // Act & Assert
        assertThatThrownBy(() -> reservationService.reserveBike("test@example.com", 1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot reserve bike from a station that is out of service");
    }

    // ========== cancelReservation Tests ==========

    @Test
    public void cancelReservation_Success_CancelsReservation() {
        // Arrange
        testBike.setBikeStatus(BikeStatus.reserved);
        testBike.setCurrentUser(testUser);
        testBike.setReservationExpDate(LocalDate.now().plusDays(1));
        testBike.setReservationExpTime(LocalTime.now());

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.of(testBike));
        when(reservationHistoryRepo.findMostRecentPendingReservation(1L, 1)).thenReturn(Optional.of(mock(ReservationHistory.class)));
        when(bikeRepo.save(any(Bike.class))).thenReturn(testBike);

        // Act
        reservationService.cancelReservation("test@example.com", 1);

        // Assert
        assertThat(testBike.getBikeStatus()).isEqualTo(BikeStatus.available);
        assertThat(testBike.getCurrentUser()).isNull();
        assertThat(testBike.getReservationExpDate()).isNull();
        assertThat(testBike.getReservationExpTime()).isNull();
        verify(bikeRepo).save(testBike);
        verify(reservationHistoryRepo).save(any(ReservationHistory.class));
    }

    @Test
    public void cancelReservation_UserNotFound_ThrowsException() {
        // Arrange
        when(userRepo.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.cancelReservation("nonexistent@example.com", 1))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    public void cancelReservation_BikeNotReserved_ThrowsException() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.cancelReservation("test@example.com", 1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bike is not reserved");
    }

    @Test
    public void cancelReservation_BikeReservedByAnotherUser_ThrowsException() {
        // Arrange
        User otherUser = Rider.builder().id(2L).email("other@example.com").build();
        testBike.setCurrentUser(otherUser);
        testBike.setBikeStatus(BikeStatus.reserved);

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.of(testBike));

        // Act & Assert
        assertThatThrownBy(() -> reservationService.cancelReservation("test@example.com", 1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bike is reserved by another user");
    }

    // ========== startTrip Tests ==========

    @Test
    public void startTrip_Success_StartsTripWithReservation() {
        // Arrange
        testBike.setBikeStatus(BikeStatus.reserved);
        testBike.setCurrentUser(testUser);

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.of(testBike));
        when(dockRepo.findByBike_Id(1)).thenReturn(Optional.of(testDock));
        when(dockstationRepo.findById(1L)).thenReturn(Optional.of(testStation));
        when(reservationHistoryRepo.findMostRecentPendingReservation(1L, 1)).thenReturn(Optional.of(mock(ReservationHistory.class)));

        // Act
        reservationService.startTrip(1, "test@example.com", null);

        // Assert
        assertThat(testBike.getBikeStatus()).isEqualTo(BikeStatus.on_trip);
        assertThat(testBike.getCurrentUser()).isEqualTo(testUser);
        assertThat(testBike.getReservationExpDate()).isNull();
        assertThat(testBike.getReservationExpTime()).isNull();
        assertThat(testBike.getTripStartTime()).isNotNull();
        assertThat(testBike.getTripStartStationName()).isEqualTo("Test Station");
        verify(dockRepo).save(testDock);
        verify(bikeRepo).save(testBike);
        verify(reservationHistoryRepo).save(any(ReservationHistory.class));
    }

    @Test
    public void startTrip_Success_StartsTripWithoutReservation() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.empty());
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.available)).thenReturn(Optional.of(testBike));
        when(dockRepo.findByBike_Id(1)).thenReturn(Optional.of(testDock));
        when(dockstationRepo.findById(1L)).thenReturn(Optional.of(testStation));

        // Act
        reservationService.startTrip(1, "test@example.com", null);

        // Assert
        assertThat(testBike.getBikeStatus()).isEqualTo(BikeStatus.on_trip);
        assertThat(testBike.getCurrentUser()).isEqualTo(testUser);
        verify(bikeRepo).save(testBike);
    }

    @Test
    public void startTrip_Success_WithDestinationData() {
        // Arrange
        testBike.setBikeStatus(BikeStatus.reserved);
        testBike.setCurrentUser(testUser);

        Map<String, Object> destinationData = Map.of(
                "stationName", "Destination Station",
                "stationId", 2L,
                "latitude", 45.5017,
                "longitude", -73.5673
        );

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.of(testBike));
        when(dockRepo.findByBike_Id(1)).thenReturn(Optional.of(testDock));
        when(dockstationRepo.findById(1L)).thenReturn(Optional.of(testStation));
        when(reservationHistoryRepo.findMostRecentPendingReservation(1L, 1)).thenReturn(Optional.of(mock(ReservationHistory.class)));

        // Act
        reservationService.startTrip(1, "test@example.com", destinationData);

        // Assert
        assertThat(testBike.getTripDestinationStationName()).isEqualTo("Destination Station");
        assertThat(testBike.getTripDestinationStationId()).isEqualTo(2L);
        assertThat(testBike.getTripDestinationLatitude()).isEqualTo(45.5017);
        assertThat(testBike.getTripDestinationLongitude()).isEqualTo(-73.5673);
    }

    @Test
    public void startTrip_BikeNotReservedOrAvailable_ThrowsException() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.empty());
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.available)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.startTrip(1, "test@example.com", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bike is not available");
    }

    @Test
    public void startTrip_BikeReservedByAnotherUser_ThrowsException() {
        // Arrange
        User otherUser = Rider.builder().id(2L).email("other@example.com").build();
        testBike.setBikeStatus(BikeStatus.reserved);
        testBike.setCurrentUser(otherUser);

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.of(testBike));

        // Act & Assert
        assertThatThrownBy(() -> reservationService.startTrip(1, "test@example.com", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bike is reserved by another user");
    }

    @Test
    public void startTrip_BikeNotDocked_ThrowsException() {
        // Arrange
        testBike.setBikeStatus(BikeStatus.reserved);
        testBike.setCurrentUser(testUser);

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.of(testBike));
        when(dockRepo.findByBike_Id(1)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.startTrip(1, "test@example.com", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bike is not docked");
    }

    @Test
    public void startTrip_StationOutOfService_ThrowsException() {
        // Arrange
        testBike.setBikeStatus(BikeStatus.reserved);
        testBike.setCurrentUser(testUser);
        testStation.setStatus(DockingStationStates.out_of_service);

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.reserved)).thenReturn(Optional.of(testBike));
        when(dockRepo.findByBike_Id(1)).thenReturn(Optional.of(testDock));
        when(dockstationRepo.findById(1L)).thenReturn(Optional.of(testStation));

        // Act & Assert
        assertThatThrownBy(() -> reservationService.startTrip(1, "test@example.com", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot start trip from a station that is out of service");
    }

    // ========== endTrip Tests ==========

    @Test
    public void endTrip_Success_EndsTripAndChargesUser() throws Exception {
        // Arrange
        testBike.setBikeStatus(BikeStatus.on_trip);
        testBike.setCurrentUser(testUser);
        testBike.setTripStartTime(LocalDateTime.now().minusMinutes(30));
        testBike.setTripStartStationName("Start Station");

        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.on_trip)).thenReturn(Optional.of(testBike));
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
        when(dockstationRepo.findById(1L)).thenReturn(Optional.of(testStation));
        when(dockRepo.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(1L)).thenReturn(Optional.of(testDock));
        when(billingService.calculateTripCost(anyLong(), eq("Standard"), anyDouble())).thenReturn(15.0);
        when(userSubscriptionRepository.hasActiveSubscription(1L)).thenReturn(false);
        when(flexdollarservice.applyFlexDollarsToTrip(1L, 15.0))
                .thenReturn(new FlexDollarService.AppliedFlexDollarsResult(0, 15.0));
        when(ridesRepo.save(any(Rides.class))).thenReturn(new Rides());
        when(dockRepo.save(any(Dock.class))).thenReturn(testDock);
        when(bikeRepo.save(any(Bike.class))).thenReturn(testBike);

        // Act
        reservationService.endTrip(1, 1L, 1L);

        // Assert
        assertThat(testBike.getBikeStatus()).isEqualTo(BikeStatus.available);
        assertThat(testBike.getCurrentUser()).isNull();
        assertThat(testBike.getTripStartTime()).isNull();
        assertThat(testBike.getTripStartStationName()).isNull();
        verify(ridesRepo).save(any(Rides.class));
        verify(paymentService).chargeForTrip(eq(1L), eq(15.0), anyString());
        verify(bikeRepo).save(testBike);
        verify(dockRepo).save(testDock);
        verify(loyaltyService).evaluateTier(1L);
    }

    @Test
    public void endTrip_WithFlexDollars_AppliesDiscount() throws Exception {
        // Arrange
        testBike.setBikeStatus(BikeStatus.on_trip);
        testBike.setCurrentUser(testUser);
        testBike.setTripStartTime(LocalDateTime.now().minusMinutes(30));

        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.on_trip)).thenReturn(Optional.of(testBike));
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
        when(dockstationRepo.findById(1L)).thenReturn(Optional.of(testStation));
        when(dockRepo.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(1L)).thenReturn(Optional.of(testDock));
        when(billingService.calculateTripCost(anyLong(), eq("Standard"), anyDouble())).thenReturn(15.0);
        when(userSubscriptionRepository.hasActiveSubscription(1L)).thenReturn(false);
        when(flexdollarservice.applyFlexDollarsToTrip(1L, 15.0))
                .thenReturn(new FlexDollarService.AppliedFlexDollarsResult(10, 5.0));
        when(ridesRepo.save(any(Rides.class))).thenReturn(new Rides());
        when(dockRepo.save(any(Dock.class))).thenReturn(testDock);
        when(bikeRepo.save(any(Bike.class))).thenReturn(testBike);

        // Act
        reservationService.endTrip(1, 1L, 1L);

        // Assert
        verify(paymentService).chargeForTrip(eq(1L), eq(5.0), anyString());
    }

    @Test
    public void endTrip_WithSubscription_NoCharge() throws Exception {
        // Arrange
        testBike.setBikeStatus(BikeStatus.on_trip);
        testBike.setCurrentUser(testUser);
        testBike.setTripStartTime(LocalDateTime.now().minusMinutes(30));

        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.on_trip)).thenReturn(Optional.of(testBike));
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
        when(dockstationRepo.findById(1L)).thenReturn(Optional.of(testStation));
        when(dockRepo.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(1L)).thenReturn(Optional.of(testDock));
        when(billingService.calculateTripCost(anyLong(), eq("Standard"), anyDouble())).thenReturn(0.0);
        when(userSubscriptionRepository.hasActiveSubscription(1L)).thenReturn(true);
        // Remove the flexDollarservice mock since it won't be called when cost is 0
        when(ridesRepo.save(any(Rides.class))).thenReturn(new Rides());
        when(dockRepo.save(any(Dock.class))).thenReturn(testDock);
        when(bikeRepo.save(any(Bike.class))).thenReturn(testBike);

        // Act
        reservationService.endTrip(1, 1L, 1L);

        // Assert
        verify(ridesRepo).save(any(Rides.class));
        verify(paymentService, never()).chargeForTrip(anyLong(), anyDouble(), anyString());
        // Verify flexDollarservice.applyFlexDollarsToTrip is NOT called when cost is 0
        verify(flexdollarservice, never()).applyFlexDollarsToTrip(anyLong(), anyDouble());
    }

    @Test
    public void endTrip_BikeNotOnTrip_ThrowsException() {
        // Arrange
        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.on_trip)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.endTrip(1, 1L, 1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bike is not on trip");
    }

    @Test
    public void endTrip_UserNotFound_ThrowsException() {
        // Arrange
        testBike.setBikeStatus(BikeStatus.on_trip);
        testBike.setCurrentUser(testUser);

        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.on_trip)).thenReturn(Optional.of(testBike));
        when(userRepo.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.endTrip(1, 1L, 1L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    public void endTrip_BikeUsedByAnotherUser_ThrowsException() {
        // Arrange
        User otherUser = Rider.builder().id(2L).build();
        testBike.setBikeStatus(BikeStatus.on_trip);
        testBike.setCurrentUser(otherUser);

        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.on_trip)).thenReturn(Optional.of(testBike));
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThatThrownBy(() -> reservationService.endTrip(1, 1L, 1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bike is on trip by another user");
    }

    @Test
    public void endTrip_StationFull_ThrowsException() {
        // Arrange
        DockingStation fullStation = createFullStation();

        testBike.setBikeStatus(BikeStatus.on_trip);
        testBike.setCurrentUser(testUser);

        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.on_trip)).thenReturn(Optional.of(testBike));
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
        when(dockstationRepo.findById(1L)).thenReturn(Optional.of(fullStation));
        when(dockRepo.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> reservationService.endTrip(1, 1L, 1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No empty dock available");
    }

    @Test
    public void endTrip_MissingStartTime_ThrowsException() {
        // Arrange
        testBike.setBikeStatus(BikeStatus.on_trip);
        testBike.setCurrentUser(testUser);
        testBike.setTripStartTime(null);

        when(bikeRepo.findByIdAndBikeStatus(1, BikeStatus.on_trip)).thenReturn(Optional.of(testBike));
        when(userRepo.findById(1L)).thenReturn(Optional.of(testUser));
        when(dockstationRepo.findById(1L)).thenReturn(Optional.of(testStation));
        when(dockRepo.findFirstByStation_IdAndBikeIsNullOrderByIdAsc(1L)).thenReturn(Optional.of(testDock));

        // Act & Assert
        assertThatThrownBy(() -> reservationService.endTrip(1, 1L, 1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Trip start time is missing");
    }

    // ========== expireReservations Tests ==========

    @Test
    public void expireReservations_ExpiresOldReservations() {
        // Arrange
        Bike expiredBike = new Bike("Standard");
        expiredBike.setId(1);
        expiredBike.setBikeStatus(BikeStatus.reserved);
        expiredBike.setCurrentUser(testUser);
        expiredBike.setReservationExpDate(LocalDate.now().minusDays(1));
        expiredBike.setReservationExpTime(LocalTime.now());

        Bike validBike = new Bike("Standard");
        validBike.setId(2);
        validBike.setBikeStatus(BikeStatus.reserved);
        validBike.setCurrentUser(testUser);
        validBike.setReservationExpDate(LocalDate.now().plusDays(1));
        validBike.setReservationExpTime(LocalTime.now());

        when(bikeRepo.findByBikeStatus(BikeStatus.reserved)).thenReturn(List.of(expiredBike, validBike));
        when(bikeRepo.save(any(Bike.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationHistoryRepo.findMostRecentPendingReservation(1L, 1)).thenReturn(Optional.of(mock(ReservationHistory.class)));

        // Act
        reservationService.expireReservations();

        // Assert
        assertThat(expiredBike.getBikeStatus()).isEqualTo(BikeStatus.available);
        assertThat(expiredBike.getCurrentUser()).isNull();
        assertThat(validBike.getBikeStatus()).isEqualTo(BikeStatus.reserved);
        assertThat(validBike.getCurrentUser()).isEqualTo(testUser);
        verify(bikeRepo, times(1)).save(expiredBike);
        verify(bikeRepo, never()).save(validBike);
        verify(reservationHistoryRepo).save(any(ReservationHistory.class));
    }

    @Test
    public void expireReservations_SkipsBikesWithNullExpiryDates() {
        // Arrange
        Bike bikeWithoutExpiry = new Bike("Standard");
        bikeWithoutExpiry.setId(1);
        bikeWithoutExpiry.setBikeStatus(BikeStatus.reserved);
        bikeWithoutExpiry.setCurrentUser(testUser);
        bikeWithoutExpiry.setReservationExpDate(null);
        bikeWithoutExpiry.setReservationExpTime(null);

        when(bikeRepo.findByBikeStatus(BikeStatus.reserved)).thenReturn(List.of(bikeWithoutExpiry));

        // Act
        reservationService.expireReservations();

        // Assert
        verify(bikeRepo, never()).save(any(Bike.class));
    }

    // ========== Additional Tests for New Methods ==========

    @Test
    public void getCurrentUserReservation_ReturnsReservation() {
        // Arrange
        testBike.setBikeStatus(BikeStatus.reserved);
        testBike.setCurrentUser(testUser);
        testBike.setReservationExpDate(LocalDate.now().plusDays(1));
        testBike.setReservationExpTime(LocalTime.now().plusMinutes(10));

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByCurrentUserAndBikeStatus(testUser, BikeStatus.reserved)).thenReturn(Optional.of(testBike));
        when(dockRepo.findByBike_Id(1)).thenReturn(Optional.of(testDock));

        // Act
        var result = reservationService.getCurrentUserReservation("test@example.com");

        // Assert
        assertThat(result.hasReservation()).isTrue();
        assertThat(result.bikeId()).isEqualTo(1);
        assertThat(result.stationName()).isEqualTo("Test Station");
    }

    @Test
    public void getCurrentUserReservation_NoReservation_ReturnsEmpty() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByCurrentUserAndBikeStatus(testUser, BikeStatus.reserved)).thenReturn(Optional.empty());

        // Act
        var result = reservationService.getCurrentUserReservation("test@example.com");

        // Assert
        assertThat(result.hasReservation()).isFalse();
    }

    @Test
    public void getCurrentUserTrip_ReturnsActiveTrip() {
        // Arrange
        testBike.setBikeStatus(BikeStatus.on_trip);
        testBike.setCurrentUser(testUser);
        testBike.setTripStartTime(LocalDateTime.now().minusMinutes(10));
        testBike.setTripStartStationName("Start Station");

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByCurrentUserAndBikeStatus(testUser, BikeStatus.on_trip)).thenReturn(Optional.of(testBike));

        // Act
        var result = reservationService.getCurrentUserTrip("test@example.com");

        // Assert
        assertThat(result.hasActiveTrip()).isTrue();
        assertThat(result.bikeId()).isEqualTo(1);
        assertThat(result.startStationName()).isEqualTo("Start Station");
    }

    @Test
    public void getCurrentUserTrip_NoActiveTrip_ReturnsEmpty() {
        // Arrange
        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(bikeRepo.findByCurrentUserAndBikeStatus(testUser, BikeStatus.on_trip)).thenReturn(Optional.empty());

        // Act
        var result = reservationService.getCurrentUserTrip("test@example.com");

        // Assert
        assertThat(result.hasActiveTrip()).isFalse();
    }
}