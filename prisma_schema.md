# VoltFlow - Prisma Schema MVP

This schema implements the multi-tenant architecture and sets the foundation for tracking charging sessions and meter values.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// -------------------------------------------------------------
// CORE MULTI-TENANT STRUCTURE
// -------------------------------------------------------------

/// The root entity. Represents a Site Host (condo, mall, pharmacy).
model Organization {
  id        String   @id @default(uuid())
  name      String
  splitRate Float?   // Custom VoltFlow split rate (e.g. 0.05 for 5%)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
  stations  Station[]
}

/// A physical location (e.g., "Shopping Center Parking Lot A")
model Station {
  id             String       @id @default(uuid())
  organizationId String
  name           String
  address        String
  lat            Float
  lng            Float
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  chargePoints   ChargePoint[]
}

// -------------------------------------------------------------
// USER MANAGEMENT
// -------------------------------------------------------------

enum Role {
  ADMIN   // VoltFlow Super Admin
  OWNER   // Site Host Owner
  DRIVER  // EV Driver
}

model User {
  id             String        @id @default(uuid())
  externalId     String        @unique // Clerk or Firebase Auth ID
  email          String        @unique
  name           String
  role           Role          @default(DRIVER)
  organizationId String?       // Nullable because Drivers don't have an org
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  organization   Organization? @relation(fields: [organizationId], references: [id])
  sessions       ChargeSession[] // Sessions started by this user (Driver)
}

// -------------------------------------------------------------
// HARDWARE / CHARGING
// -------------------------------------------------------------

enum CPStatus {
  AVAILABLE
  PREPARING
  CHARGING
  FINISHING
  FAULTED
  UNAVAILABLE
}

/// Represents the physical charger hardware
model ChargePoint {
  id             String    @id @default(uuid())
  stationId      String
  ocppId         String    @unique // The ID configured in the hardware interface
  status         CPStatus  @default(AVAILABLE)
  pricePerKwh    Float     // Cost configured by the host
  connectorType  String    // e.g "Type 2", "CCS2"
  maxPowerKw     Float
  lastSeenAt     DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  station        Station         @relation(fields: [stationId], references: [id])
  sessions       ChargeSession[]
  meterValues    MeterValue[]
}

// -------------------------------------------------------------
// SESSIONS & TRANSACTIONS
// -------------------------------------------------------------

enum SessionStatus {
  STARTED
  STOPPED
  BILLED
}

/// A single charging event
model ChargeSession {
  id              String        @id @default(uuid())
  chargePointId   String
  userId          String        // The Driver who started it
  status          SessionStatus @default(STARTED)
  kwhConsumed     Float         @default(0.0)
  totalCost       Float         @default(0.0)
  startedAt       DateTime      @default(now())
  stoppedAt       DateTime?

  chargePoint     ChargePoint   @relation(fields: [chargePointId], references: [id])
  user            User          @relation(fields: [userId], references: [id])
  transactions    Transaction[]
}

/// Financial history for a session (the split payment record)
model Transaction {
  id              String        @id @default(uuid())
  sessionId       String
  paymentId       String        @unique // ID from Stripe/Efi
  amount          Float
  voltflowFee     Float
  hostAmount      Float
  status          String        // e.g., "PAID", "FAILED"
  createdAt       DateTime      @default(now())

  session         ChargeSession @relation(fields: [sessionId], references: [id])
}

/// Raw stream of watts/voltage coming from the charger every few seconds.
/// In production, this table should be partitioned by time (e.g. using TimescaleDB).
model MeterValue {
  id            String   @id @default(uuid())
  chargePointId String
  timestamp     DateTime
  kwh           Float    // Cumulative energy reading
  powerKw       Float?   // Instantaneous power
  
  chargePoint   ChargePoint @relation(fields: [chargePointId], references: [id])

  @@index([chargePointId, timestamp])
}
```
