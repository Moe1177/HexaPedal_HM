"use client";

import { useState } from "react";
import { updateStationPosition } from "@/app/services/operator/stations/updateStationPosition";

interface EditStationPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  stationId: number;
  stationName: string;
  currentLatitude: number;
  currentLongitude: number;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function EditStationPositionModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  stationId,
  stationName,
  currentLatitude,
  currentLongitude,
  showToast,
}: EditStationPositionModalProps) {
  const [latitude, setLatitude] = useState(currentLatitude);
  const [longitude, setLongitude] = useState(currentLongitude);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (latitude < -90 || latitude > 90) {
      setError("Latitude must be between -90 and 90");
      return;
    }
    if (longitude < -180 || longitude > 180) {
      setError("Longitude must be between -180 and 180");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStationPosition(
        stationId,
        { latitude, longitude },
        token
      );
      showToast?.("Station position updated successfully!", "success");
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update station position";
      setError(errorMessage);
      showToast?.(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full border border-neutral-200 dark:border-neutral-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Update Station Position
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Change the location of {stationName}
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
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
              required
            />
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              <strong>Current position:</strong>
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Lat: {currentLatitude.toFixed(6)}, Lng:{" "}
              {currentLongitude.toFixed(6)}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 mb-2">
              <strong>New position:</strong>
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
            </p>
          </div>

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
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Position"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

