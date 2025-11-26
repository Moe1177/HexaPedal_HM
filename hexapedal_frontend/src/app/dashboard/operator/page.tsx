"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MapView from "@/app/components/views/MapView";
import StationManagement from "@/app/components/operator/StationManagement";
import BikeManagement from "@/app/components/operator/BikeManagement";
import TruckManagement from "@/app/components/operator/TruckManagement";
import AuditLog from "@/app/components/operator/AuditLog";
import RiderDashboard from "@/app/dashboard/rider/page";
import PaymentSettings from "@/app/components/operator/PaymentSettings";
import OperatorAccountView from "@/app/components/operator/OperatorAccountView";
import { MapEntitiesProvider } from "@/app/providers/MapEntitiesProvider";
import { useMapEntities } from "@/hooks/useMapEntities";
import { DockingStation } from "@/types/DockingStation";
import { connectToWebSocket, disconnectWebSocket } from "@/app/services/utils/webSocket";

function OperatorDashboardContent() {
  const [mode, setMode] = useState<"operator" | "rider">("operator");
  const [activeView, setActiveView] = useState<"map" | "stations" | "bikes" | "trucks" | "audit" | "payment" | "account">("map");
  const { reloadEntities } = useMapEntities();
  const [selectedStationForEdit, setSelectedStationForEdit] = useState<DockingStation | null>(null);

  useEffect(() => {
    console.log("[Operator Dashboard] 🔌 Connecting to WebSocket...");
    
    connectToWebSocket((message) => {
      console.log("[Operator Dashboard] 📨 WebSocket update received:", message);
      console.log("[Operator Dashboard] 🔄 Reloading map entities...");
      reloadEntities().then(() => {
        console.log("[Operator Dashboard] ✅ Map entities reloaded successfully");
      });
    });

    return () => {
      console.log("[Operator Dashboard] 🔌 Disconnecting from WebSocket");
      disconnectWebSocket();
    };
  }, [reloadEntities]);

  // Reload map entities whenever switching to map view
  useEffect(() => {
    if (activeView === "map") {
      reloadEntities();
    }
  }, [activeView, reloadEntities]);

  const handleStationChange = () => {
    // Reload map entities when stations are modified
    reloadEntities();
  };

  const handleEditState = (stationId: number) => {
    
    setActiveView("stations");
   
  };

  const handleEditPosition = (stationId: number) => {
    
    setActiveView("stations");
  };

  const handleDelete = (stationId: number) => {
    
    setActiveView("stations");
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <nav className="bg-white/70 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/60 dark:border-neutral-800 shadow-sm">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 2L22 7L22 17L12 22L2 17L2 7L12 2Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
                HexaPedal
              </span>
              <span className="ml-4 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
                {mode === "operator" ? "Operator Dashboard" : "Rider Mode"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMode(mode === "operator" ? "rider" : "operator")}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                title={mode === "operator" ? "Switch to Rider Mode" : "Switch to Operator Mode"}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mode === "operator" ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 2L22 7L22 17L12 22L2 17L2 7L12 2Z"
                    />
                  )}
                </svg>
                {mode === "operator" ? "Rider Mode" : "Operator Mode"}
              </button>
              <button className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                  OP
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {mode === "rider" ? (
        <div className="h-[calc(100vh-73px)] overflow-hidden">
          <div className="operator-rider-mode-wrapper h-full w-full">
            <RiderDashboard />
          </div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-73px)]">
          <aside className="w-64 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-sm border-r border-neutral-200/60 dark:border-neutral-800 p-6">
            <nav className="space-y-2">
            <button
              onClick={() => setActiveView("map")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeView === "map"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
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
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <span>Map View</span>
            </button>
            <button
              onClick={() => setActiveView("stations")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeView === "stations"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>Station Management</span>
            </button>
            <button
              onClick={() => setActiveView("bikes")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeView === "bikes"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Bike Management</span>
            </button>
            <button
              onClick={() => setActiveView("trucks")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeView === "trucks"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <span>Truck Management</span>
            </button>
            <button
              onClick={() => setActiveView("audit")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeView === "audit"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Audit Log</span>
            </button>
            <button
              onClick={() => setActiveView("payment")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeView === "payment"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span>Payment Settings</span>
            </button>
            <button
              onClick={() => setActiveView("account")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeView === "account"
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Account</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 relative overflow-hidden">
          {activeView === "map" ? (
            <div key="map-view" className="absolute inset-0 bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-neutral-900 dark:to-neutral-950">
              <MapView 
                isOperatorView={true}
                onEditState={handleEditState}
                onEditPosition={handleEditPosition}
                onDelete={handleDelete}
              />

              <div className="absolute bottom-6 left-6 z-[1000]">
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-xl shadow-xl p-4 border border-neutral-200/60 dark:border-neutral-700 max-w-xs">
                  <h3 className="text-sm font-bold mb-3 text-neutral-900 dark:text-neutral-100">Station Capacity</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-0.5"></div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Balanced</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">25% - 85% full</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-0.5"></div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Almost Empty or Full</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">&lt;25% or &gt;85% full</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-0.5"></div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Empty or Full</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">0% or 100% full</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeView === "stations" ? (
            <div key="stations-view" className="h-full overflow-y-auto bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6">
              <StationManagement onStationChange={handleStationChange} />
            </div>
          ) : activeView === "bikes" ? (
            <div key="bikes-view" className="h-full overflow-y-auto bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6">
              <BikeManagement onBikeChange={handleStationChange} />
            </div>
          ) : activeView === "trucks" ? (
            <div key="trucks-view" className="h-full overflow-y-auto bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6">
              <TruckManagement onTruckChange={handleStationChange} />
            </div>
          ) : activeView === "audit" ? (
            <div key="audit-view" className="h-full overflow-y-auto bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
              <AuditLog />
            </div>
          ) : activeView === "payment" ? (
            <div key="payment-view" className="h-full overflow-y-auto bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6">
              <PaymentSettings />
            </div>
          ) : (
            <div key="account-view" className="h-full overflow-y-auto">
              <OperatorAccountView />
            </div>
          )}
        </main>
        </div>
      )}
    </div>
  );
}

export default function OperatorDashboard() {
  return (
    <MapEntitiesProvider>
      <OperatorDashboardContent />
    </MapEntitiesProvider>
  );
}
