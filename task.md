# VoltFlow - Implementation Tasks

## Phase 1: Foundation & Monorepo
- [x] Initialize NPM Workspace (Monorepo)
- [x] Setup `packages/database` (Prisma schema & migrations)
- [x] Setup `packages/ocpp-types` (TypeScript interfaces)

## Phase 2: Backend (Node.js & OCPP)
- [x] Initialize `apps/backend` (Fastify + TypeScript)
- [x] Implement Redis Pub/Sub adapter (Stubbed)
- [x] Implement OCPP WebSocket Server (Basic Auth, Connection handling)
- [x] Implement `BootNotification` & `StatusNotification` handlers (Stubbed)
- [x] Implement `MeterValues` handler (saving to Partitioned Table) (Stubbed)

## Phase 3: Charger Simulator
- [x] Create `packages/charger-simulator` (Node.js script)
- [x] Connect simulator to Backend via WebSocket
- [x] Simulate charging session loop (Auth -> Start -> MeterValues -> Stop)

## Phase 4: Frontend Apps (React)
- [x] Initialize `apps/dashboard-web` (React + Vite + Tailwind)
- [x] Initialize `apps/driver-mobile` (React Native/Expo + NativeWind)
- [x] Create basic views (Dashboard Map & Host Overview)
- [x] Document REST API (Swagger/OpenAPI)

## Phase 5: REST API (Layered Architecture)
- [x] `unifiedConfig.ts` (centralized env config)
- [x] `BaseController.ts`
- [x] `ChargePointRepository.ts` (Prisma access)
- [x] `SessionService.ts` (start/stop charge logic)
- [x] `chargeRoutes.ts` (start-charge, stop-charge)
- [x] `stationRoutes.ts` (list stations for map)
- [x] Zod schemas for all routes

## Phase 6: Dashboard Web
- [x] Design system (CSS tokens, fonts, dark mode)
- [x] Layout shell (sidebar, header)
- [x] Dashboard overview page (stats, charger status)
- [x] Theme / branding (VoltFlow colors)

## Phase 7: API Integration & Auth
- [x] JWT auth middleware on backend routes
- [x] API client service (`api.ts`) using fetch
- [x] SWR hooks for Dashboard data fetching
- [x] Stations Map page (Leaflet.js)

## Phase 8: Driver Mobile App
- [x] Home screen (map + nearby chargers)
- [x] Charger detail screen
- [x] Start/Stop Charge flow
- [x] Payment screen (Pix QR Code)

## Phase 9: Real-time OCPP Notifications (WebSocket → Redis → Dashboard)
- [ ] `redisClient.ts` — IORedis singleton + Pub/Sub helpers
- [ ] Update `websocket-manager.ts` — publish OCPP events to Redis channels
- [ ] `eventsRoute.ts` — SSE endpoint (`/api/events`) that subscribes to Redis and streams to clients
- [ ] `useRealtimeEvents.ts` — React hook consuming the SSE stream
- [ ] Live charger status updates in OverviewPage + StationsPage

## Phase 10: Sessions & Revenue Pages with Charts
- [ ] Install Recharts
- [ ] `SessionsPage.tsx` — sessions table + area chart (kWh over time)
- [ ] `RevenuePage.tsx` — revenue bar chart + split breakdown donut
- [x] Mock data with realistic time series

## Phase 11: Backend Persistence & Polish
- [x] Item 3: Prisma Migrations + Docker Compose
- [x] Item 1: ChargerRegistry + RemoteStart/StopTransaction
- [x] Item 2: Real DB Persistence (StatusNotification/MeterValues)
- [x] Item 4: Basic Auth for OCPP
- [x] Item 5: Payment Split Service (Stripe/Efi stub)
- [x] Item 6: useRealtimeEvents in Dashboard
- [x] Item 7: Settings Page
- [x] Item 8: TLS/WSS preparation
- [x] Item 9: TimescaleDB for MeterValues
- [x] Item 10: Automated End-to-End Tests


