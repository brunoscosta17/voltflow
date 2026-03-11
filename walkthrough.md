# VoltFlow — Post-MVP Features Walkthrough

## Feature 5 — Dashboard Analytics & CSV Export ✅

### New files
- [exportCsv.ts](file:///c:/projects/voltflow/apps/dashboard-web/src/utils/exportCsv.ts) — CSV conversion + download trigger
- [DateRangePicker.tsx](file:///c:/projects/voltflow/apps/dashboard-web/src/components/DateRangePicker.tsx) — preset buttons (Hoje / 7d / 30d / Este mês) + custom date inputs

### Changes
- **SessionsPage**: date filter wired into `useMemo`, Export CSV button now calls [exportToCsv()](file:///c:/projects/voltflow/apps/dashboard-web/src/utils/exportCsv.ts#1-35) and shows row count
- **RevenuePage**: replaces the old last7/last14 toggler with [DateRangePicker](file:///c:/projects/voltflow/apps/dashboard-web/src/components/DateRangePicker.tsx#21-63), Export button downloads transactions CSV

---

## Feature 3 — Fault Alerts via E-mail ✅

### New file
- [AlertService.ts](file:///c:/projects/voltflow/apps/backend/src/services/AlertService.ts) — sends branded HTML e-mail via Resend API with 10-min debounce per charger

### Changes
- [websocket-manager.ts](file:///c:/projects/voltflow/apps/backend/src/ocpp/websocket-manager.ts) — calls [sendFaultAlert()](file:///c:/projects/voltflow/apps/backend/src/services/AlertService.ts#34-97) in `StatusNotification` handler when status = `Faulted` or `Unavailable`

### To enable
```bash
# apps/backend/.env
RESEND_API_KEY=re_...
ALERT_EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=ops@yourcompany.com
DASHBOARD_URL=https://dashboard.voltflow.io
```

---

## Feature 4 — Full Pix Payment Flow ✅

### New files
- [PixService.ts](file:///c:/projects/voltflow/apps/backend/src/services/PixService.ts) — Efi Pay OAuth2 (token caching), [createPixCharge()](file:///c:/projects/voltflow/apps/backend/src/services/PixService.ts#70-117), [getPixChargeStatus()](file:///c:/projects/voltflow/apps/backend/src/services/PixService.ts#118-133), [parsePixWebhook()](file:///c:/projects/voltflow/apps/backend/src/services/PixService.ts#134-148). Falls back to realistic QR mock when `EFI_CLIENT_ID` is not set.
- [pixRoutes.ts](file:///c:/projects/voltflow/apps/backend/src/routes/pixRoutes.ts) — 3 endpoints:
  - `POST /api/pix/charge` — creates QR code
  - `GET /api/pix/status/:txid` — mobile polls this every 3s
  - `POST /api/pix/webhook` — Efi callback → publishes `PIX_CONFIRMED` to Redis

### Changes
- [server.ts](file:///c:/projects/voltflow/apps/backend/src/server.ts) — registers [pixRoutes](file:///c:/projects/voltflow/apps/backend/src/routes/pixRoutes.ts#11-80)
- [redisClient.ts](file:///c:/projects/voltflow/apps/backend/src/redis/redisClient.ts) — added `PIX_CONFIRMED` to [OcppEvent](file:///c:/projects/voltflow/apps/dashboard-web/src/hooks/useRealtimeEvents.ts#3-9) union

### To enable
```bash
# apps/backend/.env
EFI_CLIENT_ID=...
EFI_CLIENT_SECRET=...
EFI_PIX_KEY=your-pix-key
EFI_SANDBOX=true
```

---

## Feature 1 — Real Authentication (Clerk) ✅

### New file
- [ClerkAuthProvider.tsx](file:///c:/projects/voltflow/apps/dashboard-web/src/components/ClerkAuthProvider.tsx) — wraps app in `<ClerkProvider>` with `<SignedIn>/<SignedOut>` guards. Exports [AuthUserButton](file:///c:/projects/voltflow/apps/dashboard-web/src/components/ClerkAuthProvider.tsx#32-68) (Clerk [UserButton](file:///c:/projects/voltflow/apps/dashboard-web/src/components/ClerkAuthProvider.tsx#32-68) or static avatar fallback).

### Changes
- [authMiddleware.ts](file:///c:/projects/voltflow/apps/backend/src/middleware/authMiddleware.ts) — dual-mode authenticate: tries Clerk token first (when `CLERK_SECRET_KEY` is set), falls back to internal JWT. Zero disruption to dev/demo.

### To enable (dashboard)
```bash
npm install @clerk/clerk-react   # apps/dashboard-web
# apps/dashboard-web/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

Wrap `<App />` in [main.tsx](file:///c:/projects/voltflow/apps/dashboard-web/src/main.tsx):
```tsx
import { ClerkAuthProvider } from './components/ClerkAuthProvider';
<ClerkAuthProvider><App /></ClerkAuthProvider>
```

### To enable (backend)
```bash
# apps/backend/.env
CLERK_SECRET_KEY=sk_...
```

---

## Feature 2 — Mobile App Publishing (EAS Build) ✅

### New file
- [eas.json](file:///c:/projects/voltflow/apps/driver-mobile/eas.json) — 3 profiles: `development`, `preview` (internal APK), `production` (auto version increment)

### Build & publish commands
```bash
npm install -g eas-cli
eas login

# Build for both stores (production profile)
eas build --platform all --profile production

# Submit after successful build
eas submit --platform ios      # Apple Developer account required
eas submit --platform android  # Google Play Console account required
```

> [!IMPORTANT]
> Update the `bundleIdentifier` (iOS) and `package` (Android) in [app.json](file:///c:/projects/voltflow/apps/driver-mobile/app.json) before your first production build, and fill in your Apple/Google credentials in `eas.json submit.production`.
