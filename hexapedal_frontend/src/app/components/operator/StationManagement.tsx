"use client";

import { useState, useEffect } from "react";
import { DockingStation, DockingStationState } from "@/types/DockingStation";
import { getAllStations } from "@/app/services/operator/stations/getAllStations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Toast from "@/app/components/ui/Toast";
import CreateStationModal from "./modals/CreateStationModal";
import EditStationStateModal from "./modals/EditStationStateModal";
import EditStationPositionModal from "./modals/EditStationPositionModal";
import DeleteStationModal from "./modals/DeleteStationModal";

interface StationManagementProps {
  onStationChange?: () => void;
}

export default function StationManagement({ onStationChange }: StationManagementProps) {
  const { token } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [stations, setStations] = useState<DockingStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<string>("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditStateModal, setShowEditStateModal] = useState(false);
  const [showEditPositionModal, setShowEditPositionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<DockingStation | null>(null);

  useEffect(() => {
    if (token) {
      loadStations();
    }
  }, [token]);

  const loadStations = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllStations(token);
      setStations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    loadStations();
    onStationChange?.();
    setShowCreateModal(false);
    setShowEditStateModal(false);
    setShowEditPositionModal(false);
    setShowDeleteModal(false);
    setSelectedStation(null);
  };

  const handleEditState = (station: DockingStation) => {
    setSelectedStation(station);
    setShowEditStateModal(true);
  };

  const handleEditPosition = (station: DockingStation) => {
    setSelectedStation(station);
    setShowEditPositionModal(true);
  };

  const handleDelete = (station: DockingStation) => {
    setSelectedStation(station);
    setShowDeleteModal(true);
  };

  const getStateBadgeColor = (state?: DockingStationState) => {
    switch (state) {
      case DockingStationState.ACTIVE:
        return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case DockingStationState.EMPTY:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400";
      case DockingStationState.FULL:
        return "bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400";
      case DockingStationState.OUT_OF_SERVICE:
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400";
    }
  };

  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterState === "all" || station.state === filterState;
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
            Station Management
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage all docking stations in the system
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Create Station
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
          >
            <option value="all">All States</option>
            <option value={DockingStationState.ACTIVE}>Active</option>
            <option value={DockingStationState.EMPTY}>Empty</option>
            <option value={DockingStationState.FULL}>Full</option>
            <option value={DockingStationState.OUT_OF_SERVICE}>
              Out of Service
            </option>
          </select>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Bikes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredStations.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    No stations found
                  </td>
                </tr>
              ) : (
                filteredStations.map((station) => (
                  <tr
                    key={station.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      #{station.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                      {station.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {station.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStateBadgeColor(
                          station.state
                        )}`}
                      >
                        {station.state || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      {station.bikeCapacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      {station.numberOfBikesDocked || 0}/{station.bikeCapacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditState(station)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          title="Edit State"
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
                        <button
                          onClick={() => handleEditPosition(station)}
                          className="text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300"
                          title="Edit Position"
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
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(station)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete Station"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
            Total Stations
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {stations.length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Active
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {
              stations.filter((s) => s.state === DockingStationState.ACTIVE)
                .length
            }
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Out of Service
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {
              stations.filter(
                (s) => s.state === DockingStationState.OUT_OF_SERVICE
              ).length
            }
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Total Capacity
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {stations.reduce((sum, s) => sum + s.bikeCapacity, 0)}
          </p>
        </div>
      </div>

      {/* Modals */}
      {token && (
        <>
          <CreateStationModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleSuccess}
            token={token}
            showToast={showToast}
          />
          {selectedStation && (
            <>
              <EditStationStateModal
                isOpen={showEditStateModal}
                onClose={() => {
                  setShowEditStateModal(false);
                  setSelectedStation(null);
                }}
                onSuccess={handleSuccess}
                token={token}
                stationId={selectedStation.id}
                stationName={selectedStation.name}
                currentState={selectedStation.state}
                showToast={showToast}
              />
              <EditStationPositionModal
                isOpen={showEditPositionModal}
                onClose={() => {
                  setShowEditPositionModal(false);
                  setSelectedStation(null);
                }}
                onSuccess={handleSuccess}
                token={token}
                stationId={selectedStation.id}
                stationName={selectedStation.name}
                currentLatitude={selectedStation.latitude}
                currentLongitude={selectedStation.longitude}
                showToast={showToast}
              />
              <DeleteStationModal
                isOpen={showDeleteModal}
                onClose={() => {
                  setShowDeleteModal(false);
                  setSelectedStation(null);
                }}
                onSuccess={handleSuccess}
                token={token}
                stationId={selectedStation.id}
                stationName={selectedStation.name}
                stationAddress={selectedStation.address}
                showToast={showToast}
              />
            </>
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

