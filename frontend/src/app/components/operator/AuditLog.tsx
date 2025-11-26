"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllRidesAudit, RideAudit } from "@/app/services/operator/audit/getAllRidesAudit";

export default function AuditLog() {
  const { token } = useAuth();
  const [rides, setRides] = useState<RideAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "cost" | "duration">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (token) {
      loadAuditLog();
    }
  }, [token]);

  const loadAuditLog = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllRidesAudit(token);
      setRides(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const filteredAndSortedRides = rides
    .filter((ride) => {
      const matchesSearch =
        ride.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.originStation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.arrivalStation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.rideId.toString().includes(searchQuery) ||
        (ride.bikeId && ride.bikeId.toString().includes(searchQuery));

      const matchesRole = filterRole === "all" || ride.userRole === filterRole;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison =
          new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      } else if (sortBy === "cost") {
        comparison = a.cost - b.cost;
      } else if (sortBy === "duration") {
        comparison = a.duration - b.duration;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadAuditLog}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Ride Audit Log
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          View all rides across the system, including operators and riders
        </p>
      </div>

      
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user, email, station, ride ID, or bike ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
          >
            <option value="all">All Roles</option>
            <option value="OPERATOR">Operators</option>
            <option value="RIDER">Riders</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-");
              setSortBy(by as "date" | "cost" | "duration");
              setSortOrder(order as "asc" | "desc");
            }}
            className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="cost-desc">Highest Cost</option>
            <option value="cost-asc">Lowest Cost</option>
            <option value="duration-desc">Longest Duration</option>
            <option value="duration-asc">Shortest Duration</option>
          </select>
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Showing {filteredAndSortedRides.length} of {rides.length} rides
        </div>
      </div>


      <div className="flex-1 overflow-auto">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Ride ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Bike
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {filteredAndSortedRides.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400"
                    >
                      No rides found
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedRides.map((ride) => (
                    <tr
                      key={ride.rideId}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        #{ride.rideId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900 dark:text-neutral-100">
                          {ride.userName}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {ride.userEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ride.userRole === "OPERATOR"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {ride.userRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                        {ride.bikeId ? (
                          <>
                            <span className="font-medium">#{ride.bikeId}</span>
                            {ride.bikeType && (
                              <span className="ml-1 text-xs">({ride.bikeType})</span>
                            )}
                          </>
                        ) : (
                          <span className="text-neutral-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ride.originStation}</span>
                          <span className="text-neutral-400">→</span>
                          <span className="font-medium">{ride.arrivalStation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                        {formatDuration(ride.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        ${ride.cost.toFixed(2)} CAD
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                        {formatDate(ride.startDateTime)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

