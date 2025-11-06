"use client";

import { useEffect, useState } from "react";
import { getStationDetails, StationDetails, DockInfo } from "@/app/services/stations/getStationDetails";
import { reserveBike } from "@/app/services/user/rider/reserveBike";
import { getEmailFromToken } from "@/app/services/user/getCurrentUser";
import { useAuth } from "@/hooks/useAuth";

interface StationDetailsModalProps {
  stationId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onReserveBike?: (bikeId: number) => void;
}

export default function StationDetailsModal({
  stationId,
  isOpen,
  onClose,
  onReserveBike,
}: StationDetailsModalProps) {
  const { token } = useAuth();
  const [stationDetails, setStationDetails] = useState<StationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    if (isOpen && stationId) {
      setIsLoading(true);
      setError(null);
      getStationDetails(stationId)
        .then((data) => {
          setStationDetails(data);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load station details");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, stationId]);

  const handleReserveBike = async (bikeId: number) => {
    if (!token) {
      setError("Please log in to reserve a bike");
      return;
    }

    const email = getEmailFromToken(token);
    if (!email) {
      setError("Unable to get user email");
      return;
    }

    setIsReserving(true);
    setError(null);
    try {
      await reserveBike(bikeId, email, token);
      if (onReserveBike) {
        onReserveBike(bikeId);
      }
      // Show success message
      setError(null);
      // Refresh station details to show updated bike status
      const updated = await getStationDetails(stationId!);
      setStationDetails(updated);
      // Show success alert
      alert(`Bike #${bikeId} reserved successfully! You have 15 minutes to unlock it.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reserve bike");
    } finally {
      setIsReserving(false);
    }
  };

  if (!isOpen) return null;

  const availableBikes = stationDetails?.docks.filter((dock) => !dock.empty && dock.bike && dock.bike.bikeStatus === "available") || [];
  const emptyDocks = stationDetails?.docks.filter((dock) => dock.empty) || [];
  const unavailableBikes = stationDetails?.docks.filter((dock) => !dock.empty && dock.bike && dock.bike.bikeStatus !== "available") || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isLoading ? "Loading..." : stationDetails?.name || "Station Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {stationDetails && !isLoading && (
            <>
              {/* Station Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {stationDetails.name}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {stationDetails.address}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      stationDetails.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {stationDetails.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Capacity</p>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {stationDetails.bikeCapacity} docks
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Bikes Docked</p>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {stationDetails.numberOfBikesDocked}/{stationDetails.bikeCapacity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Available Bikes */}
              {availableBikes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Available Bikes ({availableBikes.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableBikes.map((dock) => (
                      dock.bike && (
                        <div
                          key={dock.id}
                          className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Bike #{dock.bike.id}
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              Available
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                            Type: {dock.bike.type}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                            Dock: #{dock.id}
                          </p>
                          <button
                            onClick={() => handleReserveBike(dock.bike!.id)}
                            disabled={isReserving}
                            className="w-full mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isReserving ? "Reserving..." : "Reserve"}
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Empty Docks */}
              {emptyDocks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-neutral-400 rounded-full"></span>
                    Empty Docks ({emptyDocks.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {emptyDocks.map((dock) => (
                      <div
                        key={dock.id}
                        className="p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Dock #{dock.id}
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                            Empty
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          Available for return
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unavailable Bikes */}
              {unavailableBikes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Unavailable Bikes ({unavailableBikes.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {unavailableBikes.map((dock) => (
                      dock.bike && (
                        <div
                          key={dock.id}
                          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Bike #{dock.bike.id}
                            </span>
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                              {dock.bike.bikeStatus}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                            Type: {dock.bike.type}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Dock: #{dock.id}
                          </p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {availableBikes.length === 0 && emptyDocks.length === 0 && unavailableBikes.length === 0 && (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <p>No dock information available</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

