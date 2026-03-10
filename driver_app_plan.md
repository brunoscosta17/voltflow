# Driver Mobile App - API Integration Plan

## Overview
The Driver Mobile App currently uses mock data and non-functional state flows. The goal of this phase is to connect the app to the newly stabilized VoltFlow Backend API to allow end-to-end sessions (Find Charger → Start Charge → Stop Charge).

## 1. API Client Setup

### `apps/driver-mobile/services/api.ts`
- Create a central API client similar to the Dashboard.
- Fetch a JWT token from the backend (`POST /api/auth/token`) using a mock driver ID (`demo-driver-001`) during app initialization and save it securely.
- Add helper methods for:
  - `getStations()` -> `GET /api/stations`
  - [startCharge(chargePointId)](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/controllers/ChargeController.ts#15-38) -> `POST /api/start-charge`
  - [stopCharge(chargePointId, sessionId, kwhConsumed)](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/backend/src/controllers/ChargeController.ts#39-54) -> `POST /api/stop-charge`

## 2. Refactoring the Application State

### [apps/driver-mobile/app/index.tsx](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/driver-mobile/app/index.tsx)
- Parse `getStations` output to map Real `ChargePoints` onto the HomeScreen list instead of `MOCK_CHARGERS`.
- Update [ChargerDetailScreen](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/driver-mobile/app/index.tsx#123-182) to show the active real-time status of the hardware.
- Update [PaymentScreen](file:///C:/Users/user/.gemini/antigravity/scratch/voltflow/apps/driver-mobile/app/index.tsx#183-246) (which represents the active charging and closing modal):
  - Connect the `onStartCharge` intent to `api.startCharge()`.
  - Provide a modal/screen that watches the session flow (simulated progress).
  - Connect the *Confirm Payment* button to `api.stopCharge()`.

## 3. Real-time Status (Optional but Recommended)
- Utilize the SSE endpoint (`/api/events`) using standard `EventSource` (via an established polyfill for React Native) or interval polling to update the charger availability statuses automatically without manually reloading.
