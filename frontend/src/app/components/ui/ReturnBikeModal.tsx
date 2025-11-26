"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/app/services/utils/constants";

interface ReturnBikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturn: (stationId: number) => void;
  bikeId: number;
  isLoading?: boolean;
}

interface Station {
  id: number;
  name: string;
  address: string;
  bikeCapacity: number;
  numberOfBikesDocked: number;
  latitude: number;
  longitude: number;
}

export default function ReturnBikeModal({
  isOpen,
  onClose,
  onReturn,
  bikeId,
  isLoading = false,
}: ReturnBikeModalProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [loadingStations, setLoadingStations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStations = async () => {
    setLoadingStations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/stations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const allStations = await response.json();
        setStations(allStations);
      }
    } catch (error) {
      console.error("Failed to load stations:", error);
    } finally {
      setLoadingStations(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStations();
    }
  }, [isOpen]);

  const handleReturn = () => {
    setError(null);
    if (selectedStationId) {
      const selectedStation = stations.find(s => s.id === selectedStationId);
      if (selectedStation && selectedStation.numberOfBikesDocked >= selectedStation.bikeCapacity) {
        setError("Invalid operation, station is full");
        return;
      }
      onReturn(selectedStationId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Return Bike #{bikeId}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Select a station with available docks to return your bike:
          </p>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {loadingStations ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : stations.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <p>No stations with available docks found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stations.map((station) => {
                const availableDocks = station.bikeCapacity - station.numberOfBikesDocked;
                const isFull = station.numberOfBikesDocked >= station.bikeCapacity;
                const isSelected = selectedStationId === station.id;
                const isDisabled = isFull;

                return (
                  <div
                    key={station.id}
                    onClick={() => {
                      if (!isDisabled) {
                        setError(null);
                        setSelectedStationId(station.id);
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${isDisabled
                      ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 cursor-not-allowed opacity-60"
                      : isSelected
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                          {station.name}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                          {station.address}
                        </p>
                        {isFull ? (
                          <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                            Station is full, overflow error
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                            <span>
                              {availableDocks} dock{availableDocks !== 1 ? "s" : ""} available
                            </span>
                            <span>
                              {station.numberOfBikesDocked}/{station.bikeCapacity} occupied
                            </span>
                          </div>
                        )}
                      </div>
                      {isSelected && !isDisabled && (
                        <div className="ml-4 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={handleReturn}
              disabled={!selectedStationId || isLoading}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Returning..." : "Return Bike"}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

