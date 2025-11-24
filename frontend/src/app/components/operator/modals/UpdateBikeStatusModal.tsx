"use client";

import { useState } from "react";
import { Bike, BikeStatus } from "@/types/Bike";
import { updateBikeStatus } from "@/app/services/operator/bikes/updateBikeStatus";

interface UpdateBikeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  bike: Bike;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function UpdateBikeStatusModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  bike,
  showToast,
}: UpdateBikeStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<BikeStatus>(bike.bikeStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedStatus === bike.bikeStatus) {
      setError("Please select a different status");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBikeStatus(bike.id, selectedStatus, token);
      showToast?.(`Bike #${bike.id} status updated to ${selectedStatus}`, "success");
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update bike status";
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
            Update Bike Status
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Change the status of Bike #{bike.id} ({bike.type})
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
              Current Status
            </label>
            <div className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100">
              {bike.bikeStatus}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              New Status *
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as BikeStatus)}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
              required
            >
              <option value={BikeStatus.AVAILABLE}>Available</option>
              <option value={BikeStatus.RESERVED}>Reserved</option>
              <option value={BikeStatus.ON_TRIP}>On Trip</option>
              <option value={BikeStatus.MAINTENANCE}>Maintenance</option>
            </select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Note:</strong> Changing the bike status may affect user reservations and trips.
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
              {isSubmitting ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

