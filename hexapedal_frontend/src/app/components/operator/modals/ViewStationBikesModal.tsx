"use client";

import { useState, useEffect } from "react";
import { getStationBikes, Bike } from "@/app/services/operator/stations/getStationBikes";
import { BikeStatus } from "@/types/Bike";

interface ViewStationBikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  stationId: number;
  stationName: string;
}

export default function ViewStationBikesModal({
  isOpen,
  onClose,
  token,
  stationId,
  stationName,
}: ViewStationBikesModalProps) {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBikes();
    }
  }, [isOpen, stationId]);

  const loadBikes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStationBikes(stationId, token);
      setBikes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bikes");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-3xl w-full border border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Bikes at {stationName}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            View all bikes currently docked at this station
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : bikes.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
              No bikes currently docked at this station
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Bike ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {bikes.map((bike) => (
                    <tr
                      key={bike.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        #{bike.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                        {bike.type || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            bike.bikeStatus
                          )}`}
                        >
                          {bike.bikeStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Total Bikes at Station
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {bikes.length}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

