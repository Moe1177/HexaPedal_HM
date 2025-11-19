"use client";

import { useState, useEffect } from "react";
import { createBike } from "@/app/services/operator/bikes/createBike";
import { getAllStations } from "@/app/services/operator/stations/getAllStations";
import { getAvailableDocks } from "@/app/services/operator/stations/getAvailableDocks";
import { DockingStation, DockDTO } from "@/types/DockingStation";

interface CreateBikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function CreateBikeModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  showToast,
}: CreateBikeModalProps) {
  const [bikeType, setBikeType] = useState("Standard");
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [selectedDockId, setSelectedDockId] = useState<number | null>(null);
  const [stations, setStations] = useState<DockingStation[]>([]);
  const [availableDocks, setAvailableDocks] = useState<DockDTO[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [isLoadingDocks, setIsLoadingDocks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedStationId) {
      loadAvailableDocks(selectedStationId);
    } else {
      setAvailableDocks([]);
      setSelectedDockId(null);
    }
  }, [selectedStationId]);

  const loadStations = async () => {
    setIsLoadingStations(true);
    try {
      const data = await getAllStations(token);
      setStations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stations");
    } finally {
      setIsLoadingStations(false);
    }
  };

  const loadAvailableDocks = async (stationId: number) => {
    setIsLoadingDocks(true);
    setError(null);
    try {
      const docks = await getAvailableDocks(stationId, token);
      setAvailableDocks(docks);
      if (docks.length > 0) {
        setSelectedDockId(docks[0].id);
      } else {
        setSelectedDockId(null);
        setError("No available docks at this station");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load available docks");
      setAvailableDocks([]);
    } finally {
      setIsLoadingDocks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!bikeType.trim()) {
      setError("Bike type is required");
      return;
    }
    if (!selectedStationId) {
      setError("Please select a station");
      return;
    }
    if (!selectedDockId) {
      setError("Please select a dock");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBike(bikeType, selectedStationId, selectedDockId, token);
      // Reset form
      setBikeType("Standard");
      setSelectedStationId(null);
      setSelectedDockId(null);
      showToast?.("Bike created and docked successfully!", "success");
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create bike";
      setError(errorMessage);
      showToast?.(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-lg w-full border border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Create New Bike
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Add a new bike and dock it at a station
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Bike Type *
            </label>
            <input
              type="text"
              value={bikeType}
              onChange={(e) => setBikeType(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
              placeholder="e.g., Standard, Electric, Mountain"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Docking Station *
            </label>
            {isLoadingStations ? (
              <div className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-600 dark:text-neutral-400">
                Loading stations...
              </div>
            ) : (
              <select
                value={selectedStationId ?? ""}
                onChange={(e) => setSelectedStationId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
                required
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

          {selectedStationId && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Available Dock *
              </label>
              {isLoadingDocks ? (
                <div className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-600 dark:text-neutral-400">
                  Loading available docks...
                </div>
              ) : availableDocks.length > 0 ? (
                <select
                  value={selectedDockId ?? ""}
                  onChange={(e) => setSelectedDockId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
                  required
                >
                  {availableDocks.map((dock) => (
                    <option key={dock.id} value={dock.id}>
                      Dock #{dock.id}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-600 dark:text-yellow-400">
                  No available docks at this station
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDockId}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Bike"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

