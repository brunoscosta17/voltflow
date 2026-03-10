import { WebSocket } from '@fastify/websocket';

/**
 * Singleton registry mapping Charger OCPP IDs to their active WebSocket connection.
 * This allows the REST API (HTTP) to send commands down the WebSocket to the charger.
 */
class ChargerConnectionRegistry {
    private connections = new Map<string, WebSocket>();

    register(ocppId: string, socket: WebSocket) {
        this.connections.set(ocppId, socket);
        console.log(`[Registry] Registered socket for ${ocppId}. Active: ${this.connections.size}`);
    }

    unregister(ocppId: string) {
        this.connections.delete(ocppId);
        console.log(`[Registry] Unregistered socket for ${ocppId}. Active: ${this.connections.size}`);
    }

    getSocket(ocppId: string): WebSocket | undefined {
        return this.connections.get(ocppId);
    }

    /**
     * Sends an OCPP 1.6 Call message [2, UniqueId, Action, Payload]
     */
    sendCommand(ocppId: string, action: string, payload: Record<string, unknown>): boolean {
        const socket = this.getSocket(ocppId);
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn(`[Registry] Cannot send ${action} to ${ocppId} — socket unavailable`);
            return false;
        }

        const messageId = Math.random().toString(36).substring(2, 9);
        const message = [2, messageId, action, payload];

        socket.send(JSON.stringify(message));
        console.log(`[Registry] → Sent ${action} to ${ocppId}`);
        return true;
    }
}

export const chargerRegistry = new ChargerConnectionRegistry();
