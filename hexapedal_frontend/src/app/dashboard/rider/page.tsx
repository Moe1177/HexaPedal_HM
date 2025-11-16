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
import ReturnBikeModal from "@/app/components/ui/ReturnBikeModal";
import { getUserIdFromBike } from "@/app/services/user/getUserIdFromBike";
import LoyaltyTierBox from "@/app/components/loyalty/LoyaltyTierBox";
import LoyaltyDetailModal from "@/app/components/loyalty/LoyaltyDetailModal";
import TierNotification from "@/app/components/loyalty/TierNotification";
import { getLoyaltyStatus, evaluateTier, dismissNotification } from "@/app/services/loyalty/loyaltyService";
import { LoyaltyStatus } from "@/types/Loyalty";

type ViewType = "map" | "rides" | "billing" | "profile";

interface ActiveTrip {
  bikeId: number;
  userId: number;
  startedAt: Date;
}

interface ActiveReservation {
  bikeId: number;
  reservedAt: Date;
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

  useEffect(() => {
    if (token) {
      const userEmail = getEmailFromToken(token);
      const id = getUserIdFromToken(token);
      setEmail(userEmail);
      setUserId(id);
    }
  }, [token]);

  // Fetch loyalty status on mount
  useEffect(() => {
    const fetchLoyaltyStatus = async () => {
      if (!token) return;
      
      setIsLoadingLoyalty(true);
      try {
        const status = await getLoyaltyStatus(token);
        setLoyaltyStatus(status);
        
        // Show notification if there's a tier change
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

  const handleReserveBike = async (bikeId: number) => {
    if (!email || !token) {
      setError("Please log in to reserve a bike");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await reserveBike(bikeId, email, token);
      setActiveReservation({ bikeId, reservedAt: new Date() });
      setShowReserveModal(false);
      alert("Bike reserved successfully! You have 15 minutes to unlock it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reserve bike");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBikeReservedFromModal = (bikeId: number) => {
    setActiveReservation({ bikeId, reservedAt: new Date() });
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
    if (!token) {
      setError("Please log in to unlock a bike");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await unlockBike(bikeId, token);
      
      // Get the user ID from the bike after unlocking
      const userIdFromBike = await getUserIdFromBike(bikeId, token);
      if (!userIdFromBike) {
        throw new Error("Unable to get user ID from bike. Please try again.");
      }
      
      setActiveTrip({ bikeId, userId: userIdFromBike, startedAt: new Date() });
      setActiveReservation(null);
      alert("Bike unlocked! Your trip has started.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock bike");
    } finally {
      setIsLoading(false);
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
      
      // Show notification if there's a tier change
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
      
      // Update local state to mark notification as shown
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === "map"
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === "rides"
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === "billing"
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === "profile"
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
              <button
                onClick={() => setShowReturnModal(true)}
                className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                Return Bike
              </button>
            </div>
          )}

          {activeReservation && (
            <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Active Reservation</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Bike #{activeReservation.bikeId}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-3">
                Reserved: {activeReservation.reservedAt.toLocaleTimeString()}
              </p>
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
                <MapView onBikeReserved={handleBikeReservedFromModal} />
              </MapEntitiesProvider>

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
        />
      )}

      {showTierNotification && loyaltyStatus && (
        <TierNotification
          loyaltyStatus={loyaltyStatus}
          onDismiss={handleDismissNotification}
        />
      )}
    </div>
  );
}
