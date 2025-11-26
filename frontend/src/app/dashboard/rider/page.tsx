"use client";

import { useState, useEffect } from "react";
import MapView from "@/app/components/views/MapView";
import MyRidesView from "@/app/components/views/MyRidesView";
import BillingView from "@/app/components/views/BillingView";
import ProfileView from "@/app/components/views/ProfileView";
import { MapEntitiesProvider } from "@/app/providers/MapEntitiesProvider";
import { useAuth } from "@/hooks/useAuth";
import { getEmailFromToken, getUserIdFromToken } from "@/app/services/user/getCurrentUser";
import { cancelReservation } from "@/app/services/user/rider/cancelReservation";
import { reserveBike } from "@/app/services/user/rider/reserveBike";
import { unlockBike } from "@/app/services/user/rider/unlockBike";
import { returnBike } from "@/app/services/user/rider/returnBike";
import { getCurrentReservation } from "@/app/services/user/rider/getCurrentReservation";
import { getCurrentTrip } from "@/app/services/user/rider/getCurrentTrip";
import { expireReservations } from "@/app/services/user/rider/expireReservations";
import ReturnBikeModal from "@/app/components/ui/ReturnBikeModal";
import { getUserIdFromBike } from "@/app/services/user/getUserIdFromBike";
import LoyaltyTierBox from "@/app/components/loyalty/LoyaltyTierBox";
import LoyaltyDetailModal from "@/app/components/loyalty/LoyaltyDetailModal";
import TierNotification from "@/app/components/loyalty/TierNotification";
import { getLoyaltyStatus, evaluateTier, dismissNotification } from "@/app/services/loyalty/loyaltyService";
import { LoyaltyStatus } from "@/types/Loyalty";
import DestinationSelectModal from "@/app/components/ui/DestinationSelectModal";
import { getRoute, RouteCoordinate, RouteInfo, formatDistance, formatDuration } from "@/app/services/routing/getRoute";
import { API_BASE_URL } from "@/app/services/utils/constants";

type ViewType = "map" | "rides" | "billing" | "profile";

interface ActiveTrip {
  bikeId: number;
  userId: number;
  startedAt: Date;
  startStationName?: string;
}

interface ActiveReservation {
  bikeId: number;
  reservedAt: Date;
  expiresAt?: Date; 
}

interface DestinationInfo {
  stationId: number;
  stationName: string;
  latitude: number;
  longitude: number;
}

export default function RiderDashboard() {
  const { token } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>("map");
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [activeReservation, setActiveReservation] = useState<ActiveReservation | null>(null);
  const [selectedBikeId, setSelectedBikeId] = useState<number | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Loyalty state
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const [isLoadingLoyalty, setIsLoadingLoyalty] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [showTierNotification, setShowTierNotification] = useState(false);

  // Reservation timer state
  const [reservationTimeRemaining, setReservationTimeRemaining] = useState<number | null>(null);

  // Navigation state
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [destinationInfo, setDestinationInfo] = useState<DestinationInfo | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    if (token) {
      const userEmail = getEmailFromToken(token);
      const id = getUserIdFromToken(token);
      setEmail(userEmail);
      setUserId(id);
    }
  }, [token]);


  useEffect(() => {
    const fetchLoyaltyStatus = async () => {
      if (!token) return;

      setIsLoadingLoyalty(true);
      try {
        const status = await getLoyaltyStatus(token);
        setLoyaltyStatus(status);


        if (status.hasNotification) {
          setShowTierNotification(true);
        }
      } catch (err) {
        console.error("Failed to fetch loyalty status:", err);
      } finally {
        setIsLoadingLoyalty(false);
      }
    };

    fetchLoyaltyStatus();
  }, [token]);


  useEffect(() => {
    const fetchCurrentReservation = async () => {
      if (!token) return;

      try {
        const reservationStatus = await getCurrentReservation(token);

        if (!reservationStatus.hasReservation || !reservationStatus.bikeId) {
          setActiveReservation(null);
          setReservationTimeRemaining(null);
          return;
        }

        const expiresAt = reservationStatus.expiresAt ? new Date(reservationStatus.expiresAt) : null;

        if (expiresAt && expiresAt.getTime() <= Date.now()) {
          setActiveReservation(null);
          setReservationTimeRemaining(null);
          return;
        }
        let reservedAt = new Date();
        if (expiresAt && loyaltyStatus) {
          const holdMinutes = loyaltyStatus.reservationHoldMinutes || 10;
          reservedAt = new Date(expiresAt.getTime() - (holdMinutes * 60 * 1000));
        }

        setActiveReservation({
          bikeId: reservationStatus.bikeId,
          reservedAt,
          expiresAt: expiresAt || undefined
        });
      } catch (err) {
        console.error("Failed to fetch current reservation:", err);
        setActiveReservation(null);
        setReservationTimeRemaining(null);
      }
    };

    fetchCurrentReservation();
  }, [token, loyaltyStatus]);


  useEffect(() => {
    const fetchCurrentTrip = async () => {
      if (!token) return;

      try {
        const tripStatus = await getCurrentTrip(token);
        if (tripStatus.hasActiveTrip && tripStatus.bikeId && tripStatus.userId) {
          setActiveTrip({
            bikeId: tripStatus.bikeId,
            userId: tripStatus.userId,
            startedAt: tripStatus.startedAt
              ? new Date(tripStatus.startedAt)
              : new Date(),
            startStationName: tripStatus.startStationName || undefined
          });

          // Restore destination and route
          if (tripStatus.destinationStationId &&
            tripStatus.destinationStationName &&
            tripStatus.destinationLatitude &&
            tripStatus.destinationLongitude) {

            setDestinationInfo({
              stationId: tripStatus.destinationStationId,
              stationName: tripStatus.destinationStationName,
              latitude: tripStatus.destinationLatitude,
              longitude: tripStatus.destinationLongitude
            });

            // Get start station coordinates and fetch route
            const startStationCoords = await getStartStationCoordinatesFromName(tripStatus.startStationName);
            if (startStationCoords) {
              try {
                const route = await getRoute(
                  startStationCoords.latitude,
                  startStationCoords.longitude,
                  tripStatus.destinationLatitude,
                  tripStatus.destinationLongitude
                );
                setRouteCoordinates(route.coordinates);
                setRouteInfo(route);
                console.log("Route restored from saved trip data");
              } catch (routeErr) {
                console.error("Failed to restore route:", routeErr);
                const errorMessage = routeErr instanceof Error ? routeErr.message : "Failed to fetch route";
                if (errorMessage.includes("Invalid coordinates") || errorMessage.includes("too large")) {
                  console.warn("Route cannot be displayed due to invalid coordinates. Trip will continue without route visualization.");
                  setError("Warning: Route cannot be displayed. Station coordinates may be invalid. Please contact support.");
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch current trip:", err);
      }
    };

    fetchCurrentTrip();
  }, [token]);

  // Countdown timer for active reservation
  useEffect(() => {
    if (!activeReservation || !loyaltyStatus) {
      setReservationTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      let expiryTime: number;

      if (activeReservation.expiresAt) {
        expiryTime = activeReservation.expiresAt.getTime();
      } else {
        const reservationHoldMinutes = loyaltyStatus.reservationHoldMinutes || 10;
        expiryTime = new Date(activeReservation.reservedAt).getTime() + (reservationHoldMinutes * 60 * 1000);
      }

      const now = Date.now();
      const remainingMs = expiryTime - now;
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      return remainingSeconds;
    };

    // Initial calculation
    const initialRemaining = calculateTimeRemaining();
    setReservationTimeRemaining(initialRemaining);

    // If already expired, trigger the expiration
    if (initialRemaining <= 0) {
      handleReservationExpiration();
      return;
    }

    // Set up interval to update the timer every second
    const intervalId = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setReservationTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        handleReservationExpiration();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeReservation, loyaltyStatus]);

  useEffect(() => {
    if (!token || !activeReservation) return;

    // Check reservation status every 5 seconds to catch operator cancellations
    const checkInterval = setInterval(async () => {
      try {
        const reservationStatus = await getCurrentReservation(token);

        // If backend says no reservation, clear the frontend state
        if (!reservationStatus.hasReservation || !reservationStatus.bikeId) {
          setActiveReservation(null);
          setReservationTimeRemaining(null);
          return;
        }

        if (reservationStatus.expiresAt) {
          const expiresAt = new Date(reservationStatus.expiresAt);
          if (expiresAt.getTime() <= Date.now()) {
            setActiveReservation(null);
            setReservationTimeRemaining(null);
            return;
          }

          // Update expiresAt if it changed (shouldn't happen, but be safe)
          if (activeReservation.expiresAt?.getTime() !== expiresAt.getTime()) {
            setActiveReservation(prev => prev ? {
              ...prev,
              expiresAt: expiresAt
            } : null);
          }
        }
      } catch (err) {
        console.error("Failed to verify reservation status:", err);
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [token, activeReservation]);

  const handleReservationExpiration = async () => {
    if (!activeReservation || !email || !token) return;

    console.log("Reservation expired, marking as EXPIRED and re-evaluating tier...");

    try {
      // Mark all expired reservations as EXPIRED
      await expireReservations(token);

      // Re-evaluate tier after missed reservation
      const updatedStatus = await evaluateTier(token);
      setLoyaltyStatus(updatedStatus);

      // Show tier notification if there was a change
      if (updatedStatus.hasNotification) {
        setShowTierNotification(true);
      }

      // Clear the reservation
      setActiveReservation(null);
      setReservationTimeRemaining(null);

      alert("Your reservation has expired. Please reserve a new bike if needed.");
    } catch (err) {
      console.error("Failed to handle reservation expiration:", err);
      setError(err instanceof Error ? err.message : "Failed to process expired reservation");
    }
  };

  const handleReserveBike = async (bikeId: number) => {
    if (!email || !token) {
      setError("Please log in to reserve a bike");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await reserveBike(bikeId, email, token);
      setActiveReservation({ bikeId, reservedAt: new Date(), expiresAt: undefined });
      setShowReserveModal(false);

      // Fetch updated loyalty status to get current tier's hold time
      const updatedStatus = await getLoyaltyStatus(token);
      setLoyaltyStatus(updatedStatus);

      alert(`Bike reserved successfully! You have ${updatedStatus.reservationHoldMinutes} minutes to unlock it.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reserve bike");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBikeReservedFromModal = (bikeId: number) => {
    setActiveReservation({ bikeId, reservedAt: new Date(), expiresAt: undefined });
  };

  const handleCancelReservation = async () => {
    if (!activeReservation || !email) return;

    setIsLoading(true);
    setError(null);
    try {
      await cancelReservation(activeReservation.bikeId, email, token);
      setActiveReservation(null);
      alert("Reservation cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel reservation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockBike = async (bikeId: number) => {
    // Show destination selection modal before unlocking
    setShowDestinationModal(true);
  };

  const handleDestinationSelected = async (
    stationId: number,
    stationName: string,
    latitude: number,
    longitude: number
  ) => {
    if (!token || !activeReservation) {
      setError("No active reservation found");
      setShowDestinationModal(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      setDestinationInfo({ stationId, stationName, latitude, longitude });

      // Get start station coordinates before unlocking
      const startStationCoords = await getStartStationCoordinates(activeReservation.bikeId);

      // Unlock the bike with destination data
      await unlockBike(activeReservation.bikeId, token, {
        stationId,
        stationName,
        latitude,
        longitude
      });

      const userIdFromBike = await getUserIdFromBike(activeReservation.bikeId, token);
      if (!userIdFromBike) {
        throw new Error("Unable to get user ID from bike. Please try again.");
      }

      if (startStationCoords) {
        try {
          console.log("Fetching route from:", startStationCoords, "to:", { latitude, longitude });
          const route = await getRoute(
            startStationCoords.latitude,
            startStationCoords.longitude,
            latitude,
            longitude
          );
          console.log("Route fetched successfully:", route.coordinates.length, "points");
          setRouteCoordinates(route.coordinates);
          setRouteInfo(route);
        } catch (routeErr) {
          console.error("Failed to fetch route:", routeErr);
          const errorMessage = routeErr instanceof Error ? routeErr.message : "Failed to fetch route";
          if (errorMessage.includes("Invalid coordinates") || errorMessage.includes("too large")) {
            setError("Warning: Route cannot be displayed. Station coordinates may be invalid. Your trip will continue, but route visualization is unavailable.");
          }
        }
      } else {
        console.warn("Could not determine start station coordinates, skipping route");
        setError("Warning: Could not determine start station coordinates. Route visualization will not be available.");
      }

      setActiveTrip({
        bikeId: activeReservation.bikeId,
        userId: userIdFromBike,
        startedAt: new Date()
      });
      setActiveReservation(null);
      setShowDestinationModal(false);
      alert("Bike unlocked! Your trip has started. Follow the route on the map.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock bike");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipDestination = async () => {
    if (!token || !activeReservation) {
      setError("No active reservation found");
      setShowDestinationModal(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await unlockBike(activeReservation.bikeId, token);

      const userIdFromBike = await getUserIdFromBike(activeReservation.bikeId, token);
      if (!userIdFromBike) {
        throw new Error("Unable to get user ID from bike. Please try again.");
      }

      setActiveTrip({
        bikeId: activeReservation.bikeId,
        userId: userIdFromBike,
        startedAt: new Date()
      });
      setActiveReservation(null);
      setShowDestinationModal(false);
      alert("Bike unlocked! Your trip has started.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock bike");
    } finally {
      setIsLoading(false);
    }
  };

  const getStartStationCoordinates = async (bikeId: number): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      // Fetch all stations
      const response = await fetch(`${API_BASE_URL}/api/stations`);
      if (!response.ok) {
        console.error("Failed to fetch stations");
        return null;
      }

      const stations = await response.json();

      // Check each station to find the one with this bike
      for (const station of stations) {
        try {
          const bikesResponse = await fetch(`${API_BASE_URL}/api/stations/${station.id}/bikes`);
          if (bikesResponse.ok) {
            const bikes = await bikesResponse.json();
            const foundBike = bikes.find((b: any) => b.id === bikeId);
            if (foundBike) {
              console.log(`Found bike ${bikeId} at station ${station.name}`);
              return {
                latitude: station.latitude,
                longitude: station.longitude
              };
            }
          }
        } catch (stationErr) {
          continue;
        }
      }

      console.warn(`Could not find bike ${bikeId} at any station`);
      return null;
    } catch (err) {
      console.error("Failed to get start station coordinates:", err);
      return null;
    }
  };

  const getStartStationCoordinatesFromName = async (stationName: string | null): Promise<{ latitude: number; longitude: number } | null> => {
    if (!stationName) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/stations`);
      if (!response.ok) return null;

      const stations = await response.json();
      const station = stations.find((s: any) => s.name === stationName);

      if (station) {
        return {
          latitude: station.latitude,
          longitude: station.longitude
        };
      }
      return null;
    } catch (err) {
      console.error("Failed to get station coordinates from name:", err);
      return null;
    }
  };

  const handleReturnBike = async (stationId: number) => {
    if (!activeTrip || !activeTrip.userId) {
      setError("User ID not available. Please refresh the page.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await returnBike(activeTrip.bikeId, activeTrip.userId, stationId, token);
      setActiveTrip(null);
      setShowReturnModal(false);
      setSelectedStationId(null);

      // Clear the navigation state
      setDestinationInfo(null);
      setRouteCoordinates(null);
      setRouteInfo(null);

      // Fetch the updated loyalty status after completing the trip
      if (token) {
        try {
          const updatedStatus = await getLoyaltyStatus(token);
          setLoyaltyStatus(updatedStatus);

          // Show progress notification after every ride
          setShowTierNotification(true);
        } catch (err) {
          console.error("Failed to fetch updated loyalty status:", err);
        }
      }

      alert("Bike returned successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to return bike");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRide = () => {
    if (activeReservation) {
      handleUnlockBike(activeReservation.bikeId);
    } else if (activeTrip) {
      setShowReturnModal(true);
    } else {
      setShowReserveModal(true);
    }
  };

  const handleRefreshTier = async () => {
    if (!token) return;

    try {
      const status = await evaluateTier(token);
      setLoyaltyStatus(status);
      
      if (status.hasNotification) {
        setShowTierNotification(true);
      }
    } catch (err) {
      console.error("Failed to evaluate tier:", err);
    }
  };

  const handleDismissNotification = async () => {
    if (!token) return;

    setShowTierNotification(false);
    try {
      await dismissNotification(token);

      if (loyaltyStatus) {
        setLoyaltyStatus({
          ...loyaltyStatus,
          hasNotification: false,
        });
      }
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  // Function to format time remaining as MM:SS
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get the color classes based on time remaining
  const getTimerColorClasses = (seconds: number): { bg: string; border: string; text: string } => {
    const minutes = seconds / 60;

    if (minutes > 5) {
      return {
        bg: "from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-700 dark:text-emerald-400"
      };
    } else if (minutes > 2) {
      return {
        bg: "from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-400"
      };
    } else {
      return {
        bg: "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-700 dark:text-red-400"
      };
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <nav className="bg-white/70 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/60 dark:border-neutral-800 shadow-sm">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L22 7L22 17L12 22L2 17L2 7L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
                HexaPedal
              </span>
              <span className="ml-4 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
                Rider Dashboard
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)]">
        <aside className="w-64 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-sm border-r border-neutral-200/60 dark:border-neutral-800 p-6 overflow-y-auto">
          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView("map")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === "map"
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Map View</span>
            </button>
            <button
              onClick={() => setCurrentView("rides")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === "rides"
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>My Rides</span>
            </button>
            <button
              onClick={() => setCurrentView("billing")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === "billing"
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Payment</span>
            </button>
            <button
              onClick={() => setCurrentView("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === "profile"
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </button>
          </nav>

          <LoyaltyTierBox
            loyaltyStatus={loyaltyStatus}
            isLoading={isLoadingLoyalty}
            onRefresh={handleRefreshTier}
            onShowDetails={() => setShowLoyaltyModal(true)}
          />

          {activeTrip && (
            <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Active Trip</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Bike #{activeTrip.bikeId}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-3">
                Started: {activeTrip.startedAt.toLocaleTimeString()}
              </p>

              {destinationInfo && (
                <div className="mb-3 p-3 bg-white/50 dark:bg-neutral-800/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-2 mb-2">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Destination:
                      </p>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {destinationInfo.stationName}
                      </p>
                    </div>
                  </div>
                  {routeInfo && (
                    <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {formatDistance(routeInfo.distance)}
                      </span>
                      {routeInfo.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDuration(routeInfo.duration)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowReturnModal(true)}
                className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                Return Bike
              </button>
            </div>
          )}

          {activeReservation && reservationTimeRemaining !== null && (
            <div className={`mt-4 p-4 bg-gradient-to-br rounded-lg border ${getTimerColorClasses(reservationTimeRemaining).bg} ${getTimerColorClasses(reservationTimeRemaining).border}`}>
              <h4 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Active Reservation</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Bike #{activeReservation.bikeId}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-2">
                Reserved: {activeReservation.reservedAt.toLocaleTimeString()}
              </p>

              {/* Countdown Timer */}
              <div className={`mb-3 p-3 rounded-lg bg-white/50 dark:bg-neutral-800/50 border ${getTimerColorClasses(reservationTimeRemaining).border}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Expires in:
                  </span>
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${getTimerColorClasses(reservationTimeRemaining).text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-xl font-bold font-mono ${getTimerColorClasses(reservationTimeRemaining).text}`}>
                      {formatTimeRemaining(reservationTimeRemaining)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleUnlockBike(activeReservation.bikeId)}
                  disabled={isLoading || !token}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unlock Bike
                </button>
                <button
                  onClick={handleCancelReservation}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </aside>

        <main className="flex-1 relative">
          {currentView === "map" && (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-neutral-900 dark:to-neutral-950">
              <MapEntitiesProvider>
                <MapView
                  onBikeReserved={handleBikeReservedFromModal}
                  routeCoordinates={routeCoordinates || undefined}
                />
              </MapEntitiesProvider>

              {/* Map Legend */}
              <div className="absolute bottom-6 left-6 z-[1000] bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-4 border border-neutral-200 dark:border-neutral-700 max-w-xs">
                <h3 className="text-sm font-bold mb-3 text-neutral-900 dark:text-neutral-100">Station Capacity</h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-0.5"></div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Balanced</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">25% - 85% full</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-0.5"></div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Almost Empty or Full</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">&lt;25% or &gt;85% full</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-0.5"></div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Empty or Full</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">0% or 100% full</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 z-[1000]">
                <button
                  onClick={handleStartRide}
                  disabled={isLoading}
                  className="px-7 py-4 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-2xl shadow-xl hover:from-indigo-700 hover:to-sky-700 transition-all transform hover:scale-105 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {activeTrip ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Return Bike
                    </>
                  ) : activeReservation ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Unlock Bike
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Start Ride
                    </>
                  )}
                </button>
              </div>

            </div>
          )}
          {currentView === "rides" && <MyRidesView />}
          {currentView === "billing" && <BillingView />}
          {currentView === "profile" && <ProfileView />}
        </main>
      </div>

      {showReserveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Reserve a Bike</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Select a bike from the map to reserve it. You'll have 15 minutes to unlock it.
            </p>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Enter Bike ID"
                value={selectedBikeId || ""}
                onChange={(e) => setSelectedBikeId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (selectedBikeId) handleReserveBike(selectedBikeId);
                  }}
                  disabled={isLoading || !selectedBikeId}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Reserve
                </button>
                <button
                  onClick={() => setShowReserveModal(false)}
                  className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && activeTrip && (
        <ReturnBikeModal
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedStationId(null);
          }}
          onReturn={handleReturnBike}
          bikeId={activeTrip.bikeId}
          isLoading={isLoading}
        />
      )}

      {showLoyaltyModal && loyaltyStatus && (
        <LoyaltyDetailModal
          loyaltyStatus={loyaltyStatus}
          onClose={() => setShowLoyaltyModal(false)}
          token={token}
        />
      )}

      {showTierNotification && loyaltyStatus && (
        <TierNotification
          loyaltyStatus={loyaltyStatus}
          onDismiss={handleDismissNotification}
        />
      )}

      {showDestinationModal && (
        <DestinationSelectModal
          isOpen={showDestinationModal}
          onClose={() => setShowDestinationModal(false)}
          onSelectDestination={handleDestinationSelected}
          onSkip={handleSkipDestination}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
