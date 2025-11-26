"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MapView from "@/app/components/views/MapView";
import { MapEntitiesProvider } from "@/app/providers/MapEntitiesProvider";
import {
  getEmailFromToken,
  getUserIdFromToken,
} from "@/app/services/user/getCurrentUser";
import { unlockBike } from "@/app/services/user/rider/unlockBike";
import { returnBike } from "@/app/services/user/rider/returnBike";
import { getCurrentTrip } from "@/app/services/user/rider/getCurrentTrip";
import ReturnBikeModal from "@/app/components/ui/ReturnBikeModal";
import DestinationSelectModal from "@/app/components/ui/DestinationSelectModal";
import {
  getRoute,
  RouteCoordinate,
  RouteInfo,
} from "@/app/services/routing/getRoute";
import {
  getGuestToken,
  startGuestTrip,
} from "@/app/services/guest/guestSessionService";
import GuestConversionModal from "@/app/components/ui/GuestConversionModal";
import { useRouter } from "next/navigation";

interface ActiveTrip {
  bikeId: number;
  userId: number;
  startedAt: Date;
  startStationName?: string;
}

interface DestinationInfo {
  stationId: number;
  stationName: string;
  latitude: number;
  longitude: number;
}

export default function GuestDashboard() {
  const router = useRouter();
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [selectedBikeId, setSelectedBikeId] = useState<number | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);

  // Trip timer state
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Navigation state
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [destinationInfo, setDestinationInfo] =
    useState<DestinationInfo | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<
    RouteCoordinate[] | null
  >(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Initialize guest session if token exists
  useEffect(() => {
    const token = getGuestToken();
    if (token) {
      setGuestToken(token);
      const userEmail = getEmailFromToken(token);
      const id = getUserIdFromToken(token);
      setEmail(userEmail);
      setUserId(id);
    }
  }, []);

  // Fetch current active trip on mount
  useEffect(() => {
    const fetchCurrentTrip = async () => {
      if (!guestToken) return;

      try {
        const tripStatus = await getCurrentTrip(guestToken);
        if (
          tripStatus.hasActiveTrip &&
          tripStatus.bikeId &&
          tripStatus.userId
        ) {
          setActiveTrip({
            bikeId: tripStatus.bikeId,
            userId: tripStatus.userId,
            startedAt: tripStatus.startedAt
              ? new Date(tripStatus.startedAt)
              : new Date(),
            startStationName: tripStatus.startStationName || undefined,
          });

          // Restore destination 
          if (
            tripStatus.destinationStationId &&
            tripStatus.destinationStationName &&
            tripStatus.destinationLatitude &&
            tripStatus.destinationLongitude
          ) {
            setDestinationInfo({
              stationId: tripStatus.destinationStationId,
              stationName: tripStatus.destinationStationName,
              latitude: tripStatus.destinationLatitude,
              longitude: tripStatus.destinationLongitude,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch current trip:", err);
      }
    };

    fetchCurrentTrip();
  }, [guestToken]);

  // Live trip timer 
  useEffect(() => {
    if (!activeTrip) {
      setElapsedTime(0);
      return;
    }

    const updateElapsedTime = () => {
      const now = new Date().getTime();
      const start = activeTrip.startedAt.getTime();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedTime(elapsed);
    };

    // Initial calculation
    updateElapsedTime();

    // Update every second
    const intervalId = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(intervalId);
  }, [activeTrip]);

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const handleBikeSelect = (bikeId: number, stationId: number) => {
    setSelectedBikeId(bikeId);
    setSelectedStationId(stationId);
    setError(null);

    // For guests, go directly to destination selection
    setShowDestinationModal(true);
  };

  const handleDestinationSelected = async (
    destination: DestinationInfo | null
  ) => {
    setShowDestinationModal(false);

    if (selectedBikeId === null || !guestToken) return;

    setIsLoading(true);
    setError(null);

    try {
      await startGuestTrip(
        selectedBikeId,
        guestToken,
        destination
          ? {
              stationName: destination.stationName,
              stationId: destination.stationId,
              latitude: destination.latitude,
              longitude: destination.longitude,
            }
          : null
      );

      setActiveTrip({
        bikeId: selectedBikeId,
        userId: userId!,
        startedAt: new Date(),
      });

      if (destination) {
        setDestinationInfo(destination);
      }

      setSelectedBikeId(null);
      setSelectedStationId(null);

      // Show conversion modal after trip starts
      setTimeout(() => {
        setShowConversionModal(false);
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start trip";
      setError(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnBike = (
    bikeId: number,
    userId: number,
    stationId: number
  ) => {
    if (activeTrip && activeTrip.bikeId === bikeId) {
      setSelectedBikeId(bikeId);
      setSelectedStationId(stationId);
      setShowReturnModal(true);
    }
  };

  const handleReturnConfirmed = async () => {
    if (selectedBikeId === null || selectedStationId === null || !guestToken) {
      return;
    }
    
    const userIdToUse = userId || activeTrip?.userId;

    if (!userIdToUse) {
      setError("Unable to determine user ID. Please refresh and try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await returnBike(
        selectedBikeId,
        userIdToUse,
        selectedStationId,
        guestToken
      );

      setActiveTrip(null);
      setDestinationInfo(null);
      setRouteCoordinates(null);
      setRouteInfo(null);
      setShowReturnModal(false);
      setSelectedBikeId(null);
      setSelectedStationId(null);

      // Show conversion modal after trip ends
      setShowConversionModal(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to return bike";
      setError(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversionSuccess = (newToken: string) => {
    // Clear guest session and redirect to rider dashboard
    setShowConversionModal(false);
    router.push("/dashboard/rider");
  };

  const handleConversionDecline = () => {
    setShowConversionModal(false);
    // Could redirect to landing page or show thank you message
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <nav className="bg-white/70 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/60 dark:border-neutral-800 shadow-sm">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 2L22 7L22 17L12 22L2 17L2 7L12 2Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
                HexaPedal
              </span>
              <span className="ml-4 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                Guest Mode
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/login"
                className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-sm"
              >
                Log In
              </Link>
              <Link
                href="/dashboard/signup"
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-lg hover:from-indigo-600 hover:to-sky-600 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/20"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)]">
        <aside className="w-64 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-sm border-r border-neutral-200/60 dark:border-neutral-800 p-6 overflow-y-auto">
          <nav className="space-y-2">
            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <span>Map View</span>
            </div>
          </nav>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Guest Mode
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              Create an account after your ride to unlock benefits like loyalty
              rewards and ride history!
            </p>
          </div>

          {activeTrip && (
            <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Active Trip
                </h4>
                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
                  In Progress
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Bike #
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {activeTrip.bikeId}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Duration
                  </span>
                  <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                    {formatElapsedTime(elapsedTime)}
                  </span>
                </div>
              </div>

              {destinationInfo && (
                <div className="mb-3 p-3 bg-white/50 dark:bg-neutral-800/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        Destination
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                        {destinationInfo.stationName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() =>
                  handleReturnBike(
                    activeTrip.bikeId,
                    activeTrip.userId,
                    selectedStationId || 0
                  )
                }
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "End Trip"}
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 h-full overflow-hidden">
          <MapEntitiesProvider>
            <MapView routeCoordinates={routeCoordinates || undefined} />
          </MapEntitiesProvider>
        </main>
      </div>

      {showDestinationModal && selectedBikeId !== null && (
        <DestinationSelectModal
          isOpen={showDestinationModal}
          onClose={() => setShowDestinationModal(false)}
          onSelectDestination={(
            stationId,
            stationName,
            latitude,
            longitude
          ) => {
            handleDestinationSelected({
              stationId,
              stationName,
              latitude,
              longitude,
            });
          }}
          onSkip={() => handleDestinationSelected(null)}
          isLoading={isLoading}
        />
      )}

      {showReturnModal && selectedStationId !== null && (
        <ReturnBikeModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          onReturn={async (stationId) => {
            setSelectedStationId(stationId);
            await handleReturnConfirmed();
          }}
          bikeId={selectedBikeId!}
          isLoading={isLoading}
        />
      )}

      {showConversionModal && guestToken && (
        <GuestConversionModal
          isOpen={showConversionModal}
          guestToken={guestToken}
          onConversionSuccess={handleConversionSuccess}
          onDecline={handleConversionDecline}
        />
      )}
    </div>
  );
}
