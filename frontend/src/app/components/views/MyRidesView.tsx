"use client";

import { useState, useEffect } from "react";
import { Trip } from "@/types/Trip";
import { getRides } from "@/app/services/user/rider/getRides";
import { useAuth } from "@/hooks/useAuth";

export default function MyRidesView() {
  const { token } = useAuth();
  const [rides, setRides] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "active" | "cancelled">("all");

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    loadRides();
  }, [token]);

  const loadRides = async () => {
    if (!token) {
      setIsLoading(false);
      setRides([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // getRides now uses /api/ride-history/me which is token-based
      // userId parameter is optional and not used in the API call
      const data = await getRides(null, token);
      setRides(data || []);
    } catch (err) {
      // If API doesn't exist yet, show empty state
      console.error("Failed to load rides:", err);
      setRides([]);
      setError(null); // Don't show error, just show empty state
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRides = rides.filter((ride) => {
    if (filter === "all") return true;
    return ride.status === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (minutes === null || minutes === undefined) return "N/A";
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s`;
    }
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case "active":
        return "bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400";
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">My Rides</h1>
          <p className="text-neutral-600 dark:text-neutral-400">View your ride history and trip details</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {(["all", "completed", "active", "cancelled"] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === filterOption
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-12 text-center border border-neutral-200 dark:border-neutral-700">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-neutral-400 dark:text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">No rides found</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {filter === "all" ? "Start your first ride to see it here!" : `No ${filter} rides found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Ride #{ride.id}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {ride.bikeId ? `Bike #${ride.bikeId}` : "Bike information unavailable"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}
                  >
                    {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Start Station</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {ride.startStationName || `Station #${ride.startStationId}`}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {formatDate(ride.startedAt)} at {formatTime(ride.startedAt)}
                    </p>
                  </div>
                  {ride.endStationId && (
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">End Station</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {ride.endStationName || `Station #${ride.endStationId}`}
                      </p>
                      {ride.endedAt && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          {formatDate(ride.endedAt)} at {formatTime(ride.endedAt)}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">Duration</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {formatDuration(ride.duration)}
                    </p>
                    {ride.cost !== null && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        ${ride.cost.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {ride.endedAt && ride.duration && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Cost</span>
                      <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {ride.cost !== null ? `$${ride.cost.toFixed(2)}` : "Included in plan"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

