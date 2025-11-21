"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MapView from "../components/views/MapView";
import { MapEntitiesProvider } from "../providers/MapEntitiesProvider";
import {
  connectToWebSocket,
  disconnectWebSocket,
} from "@/app/services/utils/webSocket";
import { isGuestUser } from "@/app/services/guest/guestSessionService";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect guests to guest dashboard
    if (isGuestUser()) {
      router.replace("/dashboard/guest");
      return;
    }

    connectToWebSocket((message) => {
      console.log("Received update:", message);
    });

    return () => {
      disconnectWebSocket();
    };
  }, [router]);

  return (
    <div className="h-full">
      <MapEntitiesProvider>
        <MapView />
      </MapEntitiesProvider>
    </div>
  );
}
