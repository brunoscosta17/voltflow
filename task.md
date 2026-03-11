# VoltFlow - Implementation Tasks

## Phase 1: Foundation & Monorepo
- [x] Initialize NPM Workspace (Monorepo)
- [x] Setup `packages/database` (Prisma schema & migrations)
- [x] Setup `packages/ocpp-types` (TypeScript interfaces)

## Phase 2: Backend (Node.js & OCPP)
- [x] Initialize `apps/backend` (Fastify + TypeScript)
- [x] Implement Redis Pub/Sub adapter
- [x] Implement OCPP WebSocket Server (Basic Auth, Connection handling)
- [x] Implement `BootNotification` & `StatusNotification` handlers
- [x] Implement `MeterValues` handler (saving to TimescaleDB)

## Phase 3: Charger Simulator
- [x] Create `packages/charger-simulator` (Node.js script)
- [x] Connect simulator to Backend via WebSocket
- [x] Simulate charging session loop (Auth → Start → MeterValues → Stop)

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
- [x] `redisClient.ts` — IORedis singleton + Pub/Sub helpers
- [x] Update `websocket-manager.ts` — publish OCPP events to Redis channels (incl. StartTransaction / StopTransaction)
- [x] `eventsRoute.ts` — SSE endpoint (`/api/events`) subscribing to Redis and streaming to clients
- [x] `useRealtimeEvents.ts` — React hook consuming the SSE stream
- [x] Live charger status updates in OverviewPage + StationsPage

## Phase 10: Sessions & Revenue Pages with Charts
- [x] Install Recharts
- [x] `SessionsPage.tsx` — sessions table + area chart (kWh over time) + bar chart + filters
- [x] `RevenuePage.tsx` — stacked bar + area trend + donut split + per-charger breakdown
- [x] Mock data with realistic time series

## Phase 11: Internationalization (i18n)
- [x] Install `react-i18next` + `i18next`
- [x] `src/i18n/index.ts` — i18next config with localStorage persistence
- [x] Locale files: `pt.json`, `en.json`, `es.json`
- [x] `LanguageSwitcher` component (globe icon dropdown, top-right header)
- [x] All 5 pages translated via `useTranslation`
- [x] Map legend status labels translated

## Phase 12: Backend Persistence & Polish
- [x] Prisma Migrations + Docker Compose (`docker-compose.yml`)
- [x] ChargerRegistry + RemoteStart/StopTransaction
- [x] Real DB Persistence (StatusNotification / MeterValues → `MeterValueRepository.ts`)
- [x] Basic Auth for OCPP (`ocppAuth.ts`)
- [x] Payment Split Service (`PaymentService.ts`)
- [x] Settings Page (Dashboard + backend routes)
- [x] TLS/WSS preparation (server.ts + config)
- [x] TimescaleDB for MeterValues (hypertable migration)
- [x] Automated E2E Tests (`e2e.test.ts` + `SessionService.test.ts`)

## Phase 13: Polish & Completion
- [x] Fix stale `implementation_plan.md` in project root (English MVP status)
- [x] Real E2E tests — full OCPP lifecycle simulation (`e2e.test.ts`)
- [x] Driver Mobile App API integration — haversine distance, pull-to-refresh, error screen, kWh polling
- [x] Production CI/CD — GitHub Actions (4 jobs) + `docker-compose.prod.yml` + Dockerfiles + `.env.prod.example`
- [x] Settings Page functionality — mock data fallback, Invite User modal, Reset Password modal, Organization form

## 🏁 MVP Complete — No open items remaining

