"use client"
import Link from "next/link";
import MapView from "@/app/components/views/MapView";
import { MapEntitiesProvider } from "@/app/providers/MapEntitiesProvider";
import { useEffect, useState } from "react";
import { Stomp } from "@stomp/stompjs";

class StompConnectError {
}

export default function OperatorDashboard() {
  const [events, setEvents] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalBikes: 247,
    inUse: 89,
    available: 158,
    stations: 32
  });

  useEffect(() => {
    // WebSocket connection for real-time updates
    const connectWebSocket = () => {
      const socket = new WebSocket('ws://localhost:8080/ws');
      const stompClient = Stomp.over(socket);

      stompClient.connect({}, () => {
        console.log('Connected to WebSocket');

        // Subscribe to events - only this one as requested
        stompClient.subscribe('/bms/events', (message) => {
          const eventDescription = message.body;
          console.log('New event:', eventDescription);
          setEvents(prev => [eventDescription, ...prev.slice(0, 9)]); // Keep last 10 events
        });
      }, (error: string | StompConnectError) => {
        console.error('WebSocket connection error:', error);
      });

      return stompClient;
    };

    const stompClient = connectWebSocket();

    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect();
        console.log('Disconnected from WebSocket');
      }
    };
  }, []);

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
                Operator Dashboard
              </span>
              </div>
              <div className="flex items-center gap-4">
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

        <div className="flex h-[calc(100vh-73px)]">
          <aside className="w-64 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-sm border-r border-neutral-200/60 dark:border-neutral-800 p-6">
            <nav className="space-y-2">
              <Link
                  href="/operator"
                  className="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg font-medium"
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
              </Link>
              <Link
                  href="#"
                  className="flex items-center gap-3 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
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
              </Link>
              <Link
                  href="#"
                  className="flex items-center gap-3 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Analytics</span>
              </Link>
              <Link
                  href="#"
                  className="flex items-center gap-3 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Settings</span>
              </Link>
            </nav>

            {/* Recent Events Panel */}
            <div className="mt-8">
              <h3 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Recent Events
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {events.map((event, index) => (
                    <div key={index} className="text-xs p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                      {event}
                    </div>
                ))}
                {events.length === 0 && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-4">
                      No recent events
                    </div>
                )}
              </div>
            </div>
          </aside>

          <main className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-neutral-900 dark:to-neutral-950">
              <MapEntitiesProvider>
                <MapView />
              </MapEntitiesProvider>

              <div className="absolute top-4 right-4 z-[1000]">
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-neutral-200/60 dark:border-neutral-800">
                  <h4 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                    Map Controls
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                      Show All Bikes
                    </button>
                    <button className="w-full px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors text-sm font-medium">
                      Show Stations
                    </button>
                    <button className="w-full px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors text-sm font-medium">
                      Filter by Status
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 left-4 z-[1000]">
                <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-4 border border-neutral-200 dark:border-neutral-800 min-w-[200px]">
                  <h4 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                    Quick Stats
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Total Bikes
                    </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {stats.totalBikes}
                    </span>
                    </div>
                    <div className="flex justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      In Use
                    </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {stats.inUse}
                    </span>
                    </div>
                    <div className="flex justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Available
                    </span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {stats.available}
                    </span>
                    </div>
                    <div className="flex justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Stations
                    </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {stats.stations}
                    </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
  );
}