import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "./constants";

let stompClient: Client | null = null;

export function connectToWebSocket(onMessage: (msg: any) => void) {
    console.log("[WebSocket] 🌐 Connecting to:", API_BASE_URL + "/ws");
    
    stompClient = new Client({
        webSocketFactory: () => new SockJS(API_BASE_URL + "/ws"),
        onConnect: () => {
            console.log("[WebSocket] ✅ Connected successfully!");
            stompClient?.subscribe("/bms/live-updates", (message) => {
                console.log("[WebSocket] 📬 Raw message received:", message.body);
                const body = JSON.parse(message.body);
                console.log("[WebSocket] 📦 Parsed message:", body);
                onMessage(body);
            });
            console.log("[WebSocket] 🔔 Subscribed to /bms/live-updates");
        },
        onStompError: (frame) => {
            console.error("[WebSocket] ❌ STOMP error:", frame.headers["message"]);
        },
        onWebSocketError: (error) => {
            console.error("[WebSocket] ❌ WebSocket error:", error);
        },
    });
    stompClient.activate();
}

export function disconnectWebSocket() {
    if (stompClient) {
        stompClient.deactivate();
        console.log("Disconnected from WebSocket");
        stompClient = null;
    }
}

export function sendWebSocketMessage(destination: string, body: any) {
    if (stompClient && stompClient.connected) {
        stompClient.publish({ destination, body: JSON.stringify(body) });
    } else {
        console.warn("STOMP client not connected, cannot send message");
    }
}
