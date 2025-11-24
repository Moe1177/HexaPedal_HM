"use client";

import { useState, useEffect } from "react";
import { Bike, BikeStatus } from "@/types/Bike";
import { getAllBikes } from "@/app/services/operator/bikes/getAllBikes";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Toast from "@/app/components/ui/Toast";
import CreateBikeModal from "./modals/CreateBikeModal";
import UpdateBikeStatusModal from "./modals/UpdateBikeStatusModal";

interface BikeManagementProps {
  onBikeChange?: () => void;
}

export default function BikeManagement({ onBikeChange }: BikeManagementProps) {
  const { token } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);

  useEffect(() => {
    if (token) {
      loadBikes();
    }
  }, [token]);

  const loadBikes = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllBikes(token);
      setBikes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bikes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    loadBikes();
    onBikeChange?.();
    setShowCreateModal(false);
    setShowUpdateStatusModal(false);
    setSelectedBike(null);
  };

  const handleUpdateStatus = (bike: Bike) => {
    setSelectedBike(bike);
    setShowUpdateStatusModal(true);
  };

  const getStatusBadgeColor = (status: BikeStatus) => {
    switch (status) {
      case BikeStatus.AVAILABLE:
        return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case BikeStatus.RESERVED:
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400";
      case BikeStatus.ON_TRIP:
        return "bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400";
      case BikeStatus.MAINTENANCE:
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400";
    }
  };

  const filteredBikes = bikes.filter((bike) => {
    const matchesSearch =
      bike.id.toString().includes(searchQuery) ||
      bike.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bike.tripStartStationName &&
        bike.tripStartStationName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      filterStatus === "all" || bike.bikeStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Bike Management
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage all bikes in the system
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Create Bike
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by ID, type, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
          >
            <option value="all">All Statuses</option>
            <option value={BikeStatus.AVAILABLE}>Available</option>
            <option value={BikeStatus.RESERVED}>Reserved</option>
            <option value={BikeStatus.ON_TRIP}>On Trip</option>
            <option value={BikeStatus.MAINTENANCE}>Maintenance</option>
          </select>
        </div>
      </div>

      {/* Bikes Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Trip Start
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredBikes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    No bikes found
                  </td>
                </tr>
              ) : (
                filteredBikes.map((bike) => (
                  <tr
                    key={bike.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      #{bike.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                      {bike.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          bike.bikeStatus
                        )}`}
                      >
                        {bike.bikeStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {bike.tripStartStationName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {bike.tripStartTime
                        ? new Date(bike.tripStartTime).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(bike)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          title="Update Status"
                        >
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Total Bikes
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {bikes.length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Available
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {
              bikes.filter((b) => b.bikeStatus === BikeStatus.AVAILABLE)
                .length
            }
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            On Trip
          </p>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {bikes.filter((b) => b.bikeStatus === BikeStatus.ON_TRIP).length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Maintenance
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {
              bikes.filter((b) => b.bikeStatus === BikeStatus.MAINTENANCE)
                .length
            }
          </p>
        </div>
      </div>

      {/* Modals */}
      {token && (
        <>
          <CreateBikeModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleSuccess}
            token={token}
            showToast={showToast}
          />
          {selectedBike && (
            <UpdateBikeStatusModal
              isOpen={showUpdateStatusModal}
              onClose={() => {
                setShowUpdateStatusModal(false);
                setSelectedBike(null);
              }}
              onSuccess={handleSuccess}
              token={token}
              bike={selectedBike}
              showToast={showToast}
            />
          )}
        </>
      )}

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

