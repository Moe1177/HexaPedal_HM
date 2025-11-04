import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient: Client | null = null;

/**
 * Connects to the WebSocket endpoint and subscribes to a topic.
 * @param onMessage callback for handling incoming messages
 */
export function connectToWebSocket(onMessage: (msg: any) => void) {
    stompClient = new Client({
        webSocketFactory: () => new SockJS(process.env.NEXT_PUBLIC_API_URL + "/ws"),
        onConnect: () => {
            console.log("Connected to WebSocket");
            stompClient?.subscribe("/bms/station-updates", (message) => {
                const body = JSON.parse(message.body);
                onMessage(body);
            });
        },
        onStompError: (frame) => {
            console.error("STOMP error:", frame.headers["message"]);
        },
        onWebSocketError: (error) => {
            console.error("WebSocket error:", error);
        },
    });
    stompClient.activate();
}

/**
 * Disconnects the WebSocket connection.
 */
export function disconnectWebSocket() {
    if (stompClient) {
        stompClient.deactivate();
        console.log("Disconnected from WebSocket");
        stompClient = null;
    }
}

/**
 * (Optional) Send message to backend
 */
export function sendWebSocketMessage(destination: string, body: any) {
    if (stompClient && stompClient.connected) {
        stompClient.publish({ destination, body: JSON.stringify(body) });
    } else {
        console.warn("STOMP client not connected, cannot send message");
    }
}
