"use client";

import { useState, useEffect } from "react";
import { Truck } from "@/types/Truck";
import { Bike } from "@/types/Bike";
import { DockingStation } from "@/types/DockingStation";
import { getAllTrucks } from "@/app/services/operator/trucks/getAllTrucks";
import { createTruck } from "@/app/services/operator/trucks/createTruck";
import { loadBikeOntoTruck } from "@/app/services/operator/trucks/loadBike";
import { unloadBikeFromTruck } from "@/app/services/operator/trucks/unloadBike";
import { getAllBikes } from "@/app/services/operator/bikes/getAllBikes";
import { getAllStations } from "@/app/services/operator/stations/getAllStations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Toast from "@/app/components/ui/Toast";

interface TruckManagementProps {
  onTruckChange?: () => void;
}

export default function TruckManagement({ onTruckChange }: TruckManagementProps) {
  const { token } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [stations, setStations] = useState<DockingStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showUnloadModal, setShowUnloadModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [selectedBikeForLoad, setSelectedBikeForLoad] = useState<number | null>(null);
  const [selectedBikeForUnload, setSelectedBikeForUnload] = useState<number | null>(null);
  const [selectedStationForUnload, setSelectedStationForUnload] = useState<number | null>(null);
  const [newTruckCapacity, setNewTruckCapacity] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const [trucksData, bikesData, stationsData] = await Promise.all([
        getAllTrucks(token),
        getAllBikes(token),
        getAllStations(token),
      ]);
      setTrucks(trucksData);
      setBikes(bikesData);
      setStations(stationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTruck = async () => {
    if (!token || newTruckCapacity <= 0) {
      showToast("Capacity must be greater than 0", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTruck({ capacity: newTruckCapacity }, token);
      showToast("Truck created successfully!", "success");
      setShowCreateModal(false);
      setNewTruckCapacity(10);
      loadData();
      onTruckChange?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create truck";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadBike = async () => {
    if (!token || !selectedTruck || !selectedBikeForLoad) {
      showToast("Please select a truck and bike", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await loadBikeOntoTruck(selectedTruck.id, selectedBikeForLoad, token);
      showToast("Bike loaded onto truck successfully!", "success");
      setShowLoadModal(false);
      setSelectedTruck(null);
      setSelectedBikeForLoad(null);
      loadData();
      onTruckChange?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load bike";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnloadBike = async () => {
    if (!token || !selectedTruck || !selectedBikeForUnload || !selectedStationForUnload) {
      showToast("Please select a truck, bike, and station", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await unloadBikeFromTruck(
        selectedTruck.id,
        selectedBikeForUnload,
        selectedStationForUnload,
        token
      );
      showToast("Bike unloaded from truck successfully!", "success");
      setShowUnloadModal(false);
      setSelectedTruck(null);
      setSelectedBikeForUnload(null);
      setSelectedStationForUnload(null);
      loadData();
      onTruckChange?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unload bike";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const getLoadableBikes = () => {
    return bikes.filter(
      (bike) =>
        bike.bikeStatus === "available" &&
        !trucks.some((truck) => truck.bikes.some((b) => b.id === bike.id))
    );
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Truck Management
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage trucks and transport bikes between stations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Create Truck
        </button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.length === 0 ? (
          <div className="col-span-full p-8 text-center text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            No trucks available. Create one to get started.
          </div>
        ) : (
          trucks.map((truck) => (
            <div
              key={truck.id}
              className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Truck #{truck.id}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Capacity: {truck.bikes.length}/{truck.capacity}
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    truck.bikes.length >= truck.capacity
                      ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {truck.bikes.length >= truck.capacity ? "Full" : "Available"}
                </div>
              </div>

 
              <div className="mb-4">
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Bikes on Truck:
                </h4>
                {truck.bikes.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No bikes loaded
                  </p>
                ) : (
                  <div className="space-y-1">
                    {truck.bikes.map((bike) => (
                      <div
                        key={bike.id}
                        className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded text-sm"
                      >
                        <span className="text-neutral-900 dark:text-neutral-100">
                          Bike #{bike.id} - {bike.type}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedTruck(truck);
                            setSelectedBikeForUnload(bike.id);
                            setShowUnloadModal(true);
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-xs font-medium"
                        >
                          Unload
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

      
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedTruck(truck);
                    setShowLoadModal(true);
                  }}
                  disabled={truck.bikes.length >= truck.capacity}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Load Bike
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Total Trucks
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {trucks.length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Bikes in Transit
          </p>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {trucks.reduce((sum, truck) => sum + truck.bikes.length, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Available Trucks
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {trucks.filter((t) => t.bikes.length < t.capacity).length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            Loadable Bikes
          </p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {getLoadableBikes().length}
          </p>
        </div>
      </div>


      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full border border-neutral-200 dark:border-neutral-700">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Create New Truck
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTruckCapacity}
                  onChange={(e) => setNewTruckCapacity(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTruckCapacity(10);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTruck}
                  disabled={isSubmitting || newTruckCapacity <= 0}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && selectedTruck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full border border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Load Bike onto Truck #{selectedTruck.id}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Bike *
                </label>
                {getLoadableBikes().length === 0 ? (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      No available bikes to load. Bikes must be available and docked at a station.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedBikeForLoad ?? ""}
                    onChange={(e) =>
                      setSelectedBikeForLoad(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">Select a bike</option>
                    {getLoadableBikes().map((bike) => (
                      <option key={bike.id} value={bike.id}>
                        Bike #{bike.id} - {bike.type} {bike.currentStationName ? `@ ${bike.currentStationName}` : "(Not docked)"}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowLoadModal(false);
                    setSelectedTruck(null);
                    setSelectedBikeForLoad(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLoadBike}
                  disabled={isSubmitting || !selectedBikeForLoad}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "Loading..." : "Load Bike"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {showUnloadModal && selectedTruck && selectedBikeForUnload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full border border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Unload Bike #{selectedBikeForUnload} from Truck #{selectedTruck.id}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Destination Station *
                </label>
                {stations.length === 0 ? (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      No stations available.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedStationForUnload ?? ""}
                    onChange={(e) =>
                      setSelectedStationForUnload(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">Select a station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.numberOfBikesDocked || 0}/{station.bikeCapacity})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUnloadModal(false);
                    setSelectedTruck(null);
                    setSelectedBikeForUnload(null);
                    setSelectedStationForUnload(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnloadBike}
                  disabled={isSubmitting || !selectedStationForUnload}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "Unloading..." : "Unload Bike"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

