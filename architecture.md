# VoltFlow - WebSocket & Data architecture

## 1. High-Level Data Flow

The VoltFlow backend acts as the bridge between the physical world (EV Chargers) and the digital world (EV Drivers and Site Hosts). 

### The Components
1. **Charger Hardware:** Connects via WSS (WebSocket over TLS) to the Backend.
2. **OCPP Server (Backend):** A Fastify/Node.js WebSocket server that parses OCPP 1.6J/2.0.1 messages.
3. **Redis (Pub/Sub):** Used to scale the WebSocket connections and instantly notify the REST API when a charger's status changes.
4. **REST API (Backend):** Serves the Mobile App and the Web Dashboard.

## 2. The Real-Time Status Loop (Zero Latency)

When a driver opens the app to find a charger, they need to know *immediately* if it is available.

1. **Charger changes status** (e.g., someone plugs in a cable).
2. Charger sends an OCPP `StatusNotification` (Charging) via WebSocket to the Node.js Server.
3. Node.js server immediately updates the `ChargePoint` table in PostgreSQL to `status = CHARGING`.
4. Node.js server publishes a message to Redis Pub/Sub: `charger:123:status_changed`.
5. The REST API (if listening via Server-Sent Events or its own WebSocket to the App) broadcasts the new status to any driver looking at the map.

## 3. The Charging & Payment Flow

1. **Driver Authorization:** Driver scans the QR Code on the charger via the VoltFlow App.
2. App calls backend: `/api/start-charge`.
3. Backend verifies the driver's credit card/Pix pre-authorization via Stripe/Efi.
4. If payment is clear, Backend sends an OCPP `RemoteStartTransaction` to via the open WebSocket connection.
5. The Charger responds `Accepted` and begins delivering energy.
6. **Meter Values:** Every X seconds, the Charger sends a `MeterValues` message with the current kWh consumed. The backend inserts this directly into the partitioned PostgreSQL table.
7. **Stop:** Driver taps "Stop" on the app. Backend sends `RemoteStopTransaction`.
8. Backend calculates final cost (`kWh * pricePerKwh`), finalizes the Stripe/Pix charge, and executes the split to send the Host their cut.

## 4. Error Handling and Edge Cases

- **Charger disconnects in the middle of a session:** The WebSocket drops. The Node.js server detects the TCP drop, marks the charger as `UNAVAILABLE`, but keeps the `ChargeSession` as `STARTED`. When the charger reconnects, it will send a `BootNotification` and we resume the session sync.
- **Payment pre-auth fails:** The backend immediately rejects the `/api/start-charge` call. The charger is never activated.
- **Worker crash:** If the Node.js server crashes, Docker/ECS instantly restarts it. Because we are using Stateless WebSockets with Redis, the chargers will simply reconnect, authenticate via Basic Auth, and resume sending data to whichever container picks up the connection.
