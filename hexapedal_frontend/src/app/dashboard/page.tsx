"use client"

import MapView from "../components/views/MapView";
import { MapEntitiesProvider } from "../providers/MapEntitiesProvider";
import {connectToWebSocket, disconnectWebSocket} from "@/app/services/utils/webSocket";
import {useEffect} from "react";

export default function DashboardPage() {
    useEffect(() => {
        connectToWebSocket((message) => {
            console.log("Received update:", message);
        });

        return () => {
            disconnectWebSocket();
        };
    }, []);

    return (
        <div className="h-full">
            <MapEntitiesProvider>
                <MapView />
            </MapEntitiesProvider>
        </div>
    );
}