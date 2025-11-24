"use client";

import { useState } from "react";
import { deleteStation } from "@/app/services/operator/stations/deleteStation";

interface DeleteStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  stationId: number;
  stationName: string;
  stationAddress: string;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function DeleteStationModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  stationId,
  stationName,
  stationAddress,
  showToast,
}: DeleteStationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await deleteStation(stationId, token);
      showToast?.("Station deleted successfully!", "success");
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete station";
      setError(errorMessage);
      showToast?.(errorMessage, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full border border-neutral-200 dark:border-neutral-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Delete Station
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Are you sure you want to delete this station? This action cannot be
            undone.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {stationName}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
            {stationAddress}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Station ID: {stationId}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6 border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
            Warning
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Deleting this station will remove all associated data and cannot be
            recovered.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete Station"}
          </button>
        </div>
      </div>
    </div>
  );
}

