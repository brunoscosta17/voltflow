# VoltFlow — MVP Status

All 12 phases of the VoltFlow MVP are complete. This document provides a high-level summary of what was built.

## Architecture

```
EV Charger (OCPP 1.6 WebSocket)
    └── apps/backend (Fastify + IORedis)
            ├── Redis Pub/Sub  ──► GET /api/events (SSE)
            ├── PostgreSQL (TimescaleDB via Prisma)
            └── REST API (JWT-protected)
                    └── apps/dashboard-web (React + Vite)
                    └── apps/driver-mobile (Expo / React Native)
```

## Completed Phases

| Phase | Description | Key Files |
|---|---|---|
| 1 | Monorepo + Database | `packages/database/prisma/schema.prisma` |
| 2 | Backend OCPP Server | `apps/backend/src/ocpp/websocket-manager.ts` |
| 3 | Charger Simulator | `packages/charger-simulator/src/index.ts` |
| 4 | Frontend app scaffold | `apps/dashboard-web`, `apps/driver-mobile` |
| 5 | REST API (layered) | `chargeRoutes.ts`, `SessionService.ts`, `ChargePointRepository.ts` |
| 6 | Dashboard UI shell | Design system, sidebar, overview page |
| 7 | API Integration & Auth | JWT middleware, `api.ts`, SWR hooks, Leaflet map |
| 8 | Driver Mobile App | Home, Detail, Payment screens |
| 9 | Real-time Notifications | `redisClient.ts`, `eventsRoute.ts` (SSE), `useRealtimeEvents.ts` |
| 10 | Sessions & Revenue Pages | Recharts charts, `SessionsPage.tsx`, `RevenuePage.tsx` |
| 11 | Internationalization | `i18n/` (PT/EN/ES), `LanguageSwitcher` component |
| 12 | Backend Polish | `MeterValueRepository`, `PaymentService`, `ocppAuth`, TimescaleDB, TLS, E2E tests |

## Running Locally

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Run DB migrations
cd packages/database && npx prisma migrate dev

# 3. Start backend
cd apps/backend && npm run dev

# 4. Start dashboard
cd apps/dashboard-web && npm run dev -- --port 5173
```

## Environment Variables

See `apps/backend/.env` for all required values. `REDIS_URL` defaults to `redis://localhost:6379`.