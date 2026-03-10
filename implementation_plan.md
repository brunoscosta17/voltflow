# VoltFlow — Full MVP Completion Plan

## Overview
10 items remaining to complete the VoltFlow MVP:
- **3 Critical** — Core functionality (commands, persistence, migrations)
- **3 Important** — Security and integration
- **4 Desirable** — Polish and scalability

---

## 🔴 Critical Items

### Item 1 — ChargerConnectionRegistry + RemoteStart/StopTransaction

The [SessionService](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/services/SessionService.ts#20-77) has two TODOs that need to send commands back to the physical charger via WebSocket. Currently, there is no in-memory registry mapping `ocppId → WebSocket`.

#### [NEW] `apps/backend/src/ocpp/ChargerRegistry.ts`
- Singleton `Map<string, WebSocket>` — `ocppId → socket`
- Methods: `register(ocppId, socket)`, `unregister(ocppId)`, `sendCommand(ocppId, action, payload)`
- `sendCommand` constructs OCPP `Call` frame: `[2, uniqueId, action, payload]`

#### [MODIFY] [apps/backend/src/ocpp/websocket-manager.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/ocpp/websocket-manager.ts)
- On connect: `ChargerRegistry.register(chargerId, socket)`
- On close: `ChargerRegistry.unregister(chargerId)`

#### [MODIFY] [apps/backend/src/services/SessionService.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/services/SessionService.ts)
- [startCharge](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/services/SessionService.ts#26-48): remove TODO, call `ChargerRegistry.sendCommand(ocppId, 'RemoteStartTransaction', { idTag, connectorId: 1 })`
- [stopCharge](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/services/SessionService.ts#49-72): call `ChargerRegistry.sendCommand(ocppId, 'RemoteStopTransaction', { transactionId })`

---

### Item 2 — Real DB Persistence (StatusNotification + MeterValues)

OCPP events publish to Redis but never hit the database.

#### [NEW] `apps/backend/src/repositories/MeterValueRepository.ts`
- [create(chargePointId, kwh, powerKw, timestamp)](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/repositories/SessionRepository.ts#6-11) → inserts into `MeterValue` table

#### [MODIFY] [apps/backend/src/ocpp/websocket-manager.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/ocpp/websocket-manager.ts)
- `StatusNotification`: call `ChargePointRepository.updateStatus(ocppId, status)`
- `MeterValues`: call `MeterValueRepository.create(...)` after parsing samples

#### [MODIFY] [apps/backend/src/repositories/ChargePointRepository.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/repositories/ChargePointRepository.ts)
- Export a singleton or accept Prisma via DI to avoid multiple PrismaClient instances

---

### Item 3 — Prisma Migrations + `.env` setup

> [!IMPORTANT]
> This requires a PostgreSQL database to be running. We will generate migration files and provide a Docker Compose for local development.

#### [NEW] `docker-compose.yml` (root)
- `postgres:16-alpine` container on port 5432
- `redis:7-alpine` container on port 6379

#### [NEW] `packages/database/.env`
- `DATABASE_URL=postgresql://voltflow:voltflow@localhost:5432/voltflow`

#### Run migration
```bash
npx prisma migrate dev --name init --schema packages/database/prisma/schema.prisma
npx prisma generate --schema packages/database/prisma/schema.prisma
```

#### [NEW] `packages/database/prisma/seed.ts`
- Seeds one Organization, one Station, two ChargePoints, one User — for local testing

---

## 🟡 Important Items

### Item 4 — Basic Auth OCPP

The OCPP spec requires chargers to authenticate via `Authorization: Basic base64(id:password)` during the WebSocket upgrade.

#### [NEW] `apps/backend/src/ocpp/ocppAuth.ts`
- `validateOcppAuth(req: FastifyRequest): Promise<boolean>`
- Decodes `Authorization: Basic` header → looks up `ChargePoint.ocppId` + password in DB
- Returns `false` → WebSocket handler closes socket with `1008 Policy Violation`

#### [MODIFY] [apps/backend/src/ocpp/websocket-manager.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/ocpp/websocket-manager.ts)
- Call `validateOcppAuth(req)` at the top. If not valid, send `[2, null, 'BootNotification', { status: 'Rejected' }]` and close.

#### [MODIFY] [packages/database/prisma/schema.prisma](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/packages/database/prisma/schema.prisma)
- Add `ocppPassword String?` to [ChargePoint](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/driver-mobile/app/index.tsx#10-21) model (hashed with bcrypt)

---

### Item 5 — Payment Split Service (Stripe/Efi stub)

#### [NEW] `apps/backend/src/services/PaymentService.ts`
- `executeSplit({ session, organization })`: calculates `splitRate` from org (or global config), records split in `Transaction` table
- Stubbed HTTP call to Stripe Connect or Efí Marketplace — returns mock `paymentId` in dev mode
- In production: `PAYMENT_PROVIDER=stripe|efi` env var — switches between adapters

#### [MODIFY] [apps/backend/src/services/SessionService.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/services/SessionService.ts)
- [stopCharge](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/services/SessionService.ts#49-72): inject `PaymentService`, call `paymentService.executeSplit(...)` after session close

#### [MODIFY] [apps/backend/src/config/unifiedConfig.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/config/unifiedConfig.ts)
- Add `PAYMENT_PROVIDER: z.enum(['stub', 'stripe', 'efi']).default('stub')`
- Add `STRIPE_SECRET_KEY: z.string().optional()` and `EFI_CLIENT_ID/SECRET: z.string().optional()`

---

### Item 6 — useRealtimeEvents integrated in Dashboard

#### [MODIFY] [apps/dashboard-web/src/pages/OverviewPage.tsx](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/dashboard-web/src/pages/OverviewPage.tsx)
- Call [useRealtimeEvents()](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/dashboard-web/src/hooks/useRealtimeEvents.ts#42-95) — overlay `chargerStatuses` map over the static charger card list
- Show a "🟢 Live" pill in the header when `connected === true`
- Add a scrollable "Live Events" feed showing the last 10 `events[]`

#### [MODIFY] [apps/dashboard-web/src/pages/StationsPage.tsx](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/dashboard-web/src/pages/StationsPage.tsx)
- Merge `chargerStatuses` from [useRealtimeEvents()](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/dashboard-web/src/hooks/useRealtimeEvents.ts#42-95) with the SWR station list to show live status without waiting for the 10s re-fetch

---

## 🟢 Desirable Items

### Item 7 — Settings Page

#### [NEW] `apps/dashboard-web/src/pages/SettingsPage.tsx`
- Three tabs: **Organization** (name, splitRate), **Team** (list users by role), **Chargers** (add/edit charger passwords)
- Uses [api.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/dashboard-web/src/services/api.ts) for `GET/PUT /api/settings/organization`
- Split rate displayed as configurable slider (5% default)

#### [NEW] `apps/backend/src/routes/settingsRoutes.ts` + `controllers/SettingsController.ts`

---

### Item 8 — TLS / WSS Preparation

#### [MODIFY] [apps/backend/src/server.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/server.ts)
- When `NODE_ENV=production`, pass `https: { key, cert }` to Fastify from file paths defined in env vars `TLS_KEY_PATH` / `TLS_CERT_PATH`
- The OCPP charger then connects to `wss://` instead of `ws://`

#### [MODIFY] [apps/backend/src/config/unifiedConfig.ts](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/config/unifiedConfig.ts)
- Add optional `TLS_KEY_PATH` and `TLS_CERT_PATH` fields

---

### Item 9 — TimescaleDB for MeterValues

#### [MODIFY] [packages/database/prisma/schema.prisma](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/packages/database/prisma/schema.prisma)
- Add raw SQL migration to call `SELECT create_hypertable('MeterValue', 'timestamp')` after the initial migration

#### [NEW] `packages/database/prisma/migrations/timescale_hypertable.sql`
- `CREATE EXTENSION IF NOT EXISTS timescaledb;`
- `SELECT create_hypertable('"MeterValue"', 'timestamp', if_not_exists => TRUE);`

> [!NOTE]
> TimescaleDB requires a compatible PostgreSQL image: `timescale/timescaledb:latest-pg16`. Docker Compose will be updated accordingly.

---

### Item 10 — Automated End-to-End Tests

#### [NEW] `packages/charger-simulator/src/e2e.test.ts`
- Uses `ws` to connect a mock charger to the running backend
- Sends: `BootNotification` → `StatusNotification(Available)` → `StartTransaction` → `MeterValues` × 3 → `StopTransaction`
- Asserts: backend responds with `Accepted` for BootNotification; DB has a [ChargeSession](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/dashboard-web/src/services/api.ts#42-52) with `status=STOPPED`

#### [NEW] `apps/backend/src/__tests__/SessionService.test.ts`
- Unit tests for `SessionService.startCharge` and [stopCharge](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/services/SessionService.ts#49-72)
- Uses in-memory mock repositories (no DB required)
- Tests: charger not found, charger not available, cost calculation

#### Install: `vitest` + `@vitest/coverage-v8` in both packages

---

## Execution Order

| Priority | Item | Depends On |
|---|---|---|
| 1 | Item 3 — Prisma Migrations + Docker | — |
| 2 | Item 1 — ChargerRegistry + OCPP Commands | Migration done |
| 3 | Item 2 — DB Persistence in websocket-manager | Migration done |
| 4 | Item 4 — Basic Auth OCPP | Item 2 |
| 5 | Item 5 — Payment Split Service | Item 2 |
| 6 | Item 6 — useRealtimeEvents in Dashboard | Items 1-4 |
| 7 | Item 7 — Settings Page | Item 5 |
| 8 | Item 8 — TLS/WSS | — |
| 9 | Item 9 — TimescaleDB | Item 3 |
| 10 | Item 10 — Tests | All items |

## Verification Plan

### Automated
- `vitest run` in `apps/backend` and `packages/charger-simulator`
- E2E test: start docker-compose, run simulator, assert DB state

### Manual
- Run `docker-compose up`, start backend, run charger simulator
- Dashboard Overview should show live events
- Call `POST /api/start-charge` — charger should receive `RemoteStartTransaction` command
