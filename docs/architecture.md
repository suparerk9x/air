# Air — Architecture Document

## 1. System Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────┐
│  Cloudflare  │────▶│ Nginx Proxy  │────▶│   Next.js 16 (PM2)   │
│  (DNS + SSL) │     │  Manager:81  │     │   Port 3200          │
└─────────────┘     └──────────────┘     └──────────┬───────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  PostgreSQL (Docker)  │
                                          │  Port 5432            │
                                          └──────────────────────┘

Server: Oracle Cloud ARM (161.33.204.39)
OS: Ubuntu 24.04 LTS | CPU: 4 cores | RAM: 24GB | Disk: 45GB
```

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS, shadcn/ui (base-ui) |
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | JWT sessions with `jose`, HttpOnly cookies |
| ORM | Prisma 7.7.0 |
| Database | PostgreSQL 15 (Docker container) |
| Process Manager | PM2 6.0.14 |
| Reverse Proxy | Nginx Proxy Manager 2.13.7 |
| SSL | Cloudflare wildcard cert (*.lightepic.com) |
| Runtime | Node.js 22.22.0 (ARM64) |

## 3. Project Structure

```
d:\Antigravity\Air\
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Dashboard (calendar + stats)
│   │   ├── login/page.tsx            # Login
│   │   ├── register/page.tsx         # Register
│   │   ├── inventory/
│   │   │   ├── page.tsx              # Inventory hub
│   │   │   ├── items/page.tsx        # Item CRUD (POS grid)
│   │   │   └── counter/page.tsx      # Stock counter
│   │   ├── api/                      # API routes (22 endpoints)
│   │   │   ├── auth/me/              # User profile
│   │   │   ├── properties/           # Property CRUD + iCal sync
│   │   │   ├── bookings/             # Booking CRUD
│   │   │   ├── inventory/            # Items, stock, maintenance, today
│   │   │   ├── upload/               # Image upload
│   │   │   └── seed/                 # Demo data seeding
│   │   └── actions/auth.ts           # Server actions (login/register/logout)
│   ├── components/
│   │   ├── calendar/                 # Calendar, timeline, booking dialogs
│   │   └── ui/                       # shadcn/ui (base-ui components)
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── session-crypto.ts         # JWT encrypt/decrypt (Edge-safe)
│   │   ├── session.ts                # Cookie ops (server-only)
│   │   ├── auth-api.ts              # API auth helpers
│   │   ├── ical.ts                   # iCal parser
│   │   └── utils.ts                  # cn() utility
│   ├── generated/prisma/             # Prisma generated client (git-ignored)
│   └── proxy.ts                      # Route protection (Next.js 16 middleware)
├── prisma/
│   ├── schema.prisma                 # Data model (8 tables)
│   └── migrations/                   # 3 migrations
├── oracle/                           # Deployment config
│   ├── .ssh/oracle-arm.key           # SSH key (git-ignored)
│   ├── scripts/                      # deploy, backup, monitor, connect
│   └── README.md                     # Deployment docs
└── docs/                             # Project documentation
```

## 4. Data Model

### Entity Relationship

```
User (1) ──────▶ (N) Property (1) ──────▶ (N) Booking
                       │                         │
                       │ (1)                      │ (0..1)
                       ▼                          ▼
                  (N) PropertyStock          HousekeepingTask
                       │
                       │ (N..1)
                       ▼
                  InventoryItem (1) ──────▶ (N) StockLog
                       
                  MaintenanceTask ──▶ propertyId (FK, no join)
```

### Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | Multi-tenant root | email (unique), password (bcrypt), role (ADMIN/COHOST) |
| `properties` | Per-user properties | name, icalUrl, color, platform, userId (FK) |
| `bookings` | Guest reservations | startDate, endDate, status, externalUid, propertyId (FK) |
| `housekeeping_tasks` | Cleaning schedule | date, status, assignee, propertyId, bookingId (1:1) |
| `inventory_items` | Master product catalog | category, unit, minStock, usagePerCheckout |
| `property_stocks` | Stock qty per property | quantity, propertyId + itemId (unique compound) |
| `stock_logs` | Immutable audit trail | type, quantity, cost, itemId, propertyId, bookingId |
| `maintenance_tasks` | Repair/maintenance | title, priority, status, cost, propertyId |

### Enums

```
Role:               ADMIN, COHOST
BookingStatus:       CONFIRMED, CHECKEDIN, CHECKEDOUT, CANCELLED, BLOCKED
HousekeepingStatus:  PENDING, IN_PROGRESS, COMPLETED, SKIPPED
InventoryCategory:   LINEN, AMENITY, EQUIPMENT, CONSUMABLE, MAINTENANCE
StockLogType:        RESTOCK, CHECKOUT_USE, MANUAL_USE, ADJUSTMENT, TRANSFER
MaintenanceStatus:   OPEN, IN_PROGRESS, COMPLETED, CANCELLED
MaintenancePriority: LOW, MEDIUM, HIGH, URGENT
```

## 5. Authentication Architecture

```
┌──────────┐    ┌──────────┐    ┌───────────────┐    ┌──────────┐
│  Browser  │───▶│ proxy.ts │───▶│ API Route     │───▶│ Database │
│           │    │ (Edge)   │    │ (Node.js)     │    │          │
└──────────┘    └──────────┘    └───────────────┘    └──────────┘
     │               │                  │
     │          decrypt JWT        getAuthUserId()
     │          from cookie        from cookie
     │               │                  │
     │          redirect to        return 401
     │          /login if          if no session
     │          no session
     │
     ▼
  HttpOnly Cookie
  "session" = JWT { userId, role, expiresAt }
  Encrypted with HS256 + SESSION_SECRET
  Expires: 7 days
```

### Key Files

| File | Purpose | Runtime |
|------|---------|---------|
| `session-crypto.ts` | JWT encrypt/decrypt with `jose` | Edge + Node |
| `session.ts` | Cookie create/delete (imports `server-only`) | Node only |
| `auth-api.ts` | `getAuthUserId()`, `verifyPropertyOwnership()` | Node only |
| `proxy.ts` | Route protection, redirect to /login | Edge |
| `actions/auth.ts` | Server actions: login, register, logout | Node only |

### Multi-tenant Isolation

Every API route follows this pattern:

```typescript
export async function GET() {
  const userId = await getAuthUserId();      // throws if not auth'd
  const data = await prisma.model.findMany({
    where: { userId },                       // tenant filter
  });
  return NextResponse.json(data);
}
```

For nested resources (bookings, stock, maintenance):
```typescript
const userPropertyIds = await getUserPropertyIds(userId);
const data = await prisma.booking.findMany({
  where: { propertyId: { in: userPropertyIds } },
});
```

## 6. iCal Sync Flow

```
User clicks "Sync"
  ↓
POST /api/properties/[id]/sync
  ↓
Verify property ownership (userId)
  ↓
Fetch iCal feed from property.icalUrl
  ↓
Parse with node-ical
  ↓
For each event:
  ├── Find by (propertyId, externalUid) — unique compound
  ├── If exists → UPDATE (summary, dates)
  └── If new → CREATE booking
  ↓
Return { synced, created, updated }
```

## 7. Inventory & Stock Flow

### Stock Movement

```
POST /api/inventory/stock
  ↓
Verify property ownership
  ↓
Upsert PropertyStock (increment quantity)
  ↓
Ensure quantity >= 0 (floor at 0)
  ↓
Create immutable StockLog entry
  ↓
Return log entry
```

### Auto-deduct on Checkout

```
Guest status → CHECKEDOUT
  ↓
For each InventoryItem where usagePerCheckout > 0:
  ↓
POST /api/inventory/stock {
  type: "CHECKOUT_USE",
  quantity: -usagePerCheckout,
  bookingId: booking.id
}
```

### Low Stock Detection

```
GET /api/inventory/items
  ↓
For each item:
  totalStock = SUM(propertyStocks.quantity) — scoped to user's properties
  isLowStock = totalStock <= item.minStock
```

## 8. Deployment Topology

```
Internet
  ↓
Cloudflare (DNS + SSL proxy)
  ↓
Oracle Cloud ARM (161.33.204.39)
  ├── Nginx Proxy Manager (Docker, ports 80/443)
  │     └── air.lightepic.com → 172.17.0.1:3200
  ├── PM2
  │     └── air (Next.js, port 3200)
  └── Docker
        └── docker-db_postgres-1 (PostgreSQL 15, port 5432)
              └── database: air
```

### Deployment Process

```bash
bash oracle/scripts/deploy.sh

# Internally:
# 1. git push origin master
# 2. SSH to server
# 3. git pull
# 4. npm install
# 5. npx prisma generate
# 6. npx prisma migrate deploy
# 7. npm run build (Turbopack)
# 8. pm2 reload air (zero-downtime)
```

### Environment Variables (server)

```
DATABASE_URL=postgresql://postgres:<pw>@172.18.0.8:5432/air
NODE_ENV=production
PORT=3200
SESSION_SECRET=<32-byte-base64>
```

## 9. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| JWT over next-auth | Simple email/password only, full control, no beta dependency |
| `jose` over `jsonwebtoken` | Edge-compatible (works in proxy.ts) |
| `proxy.ts` over `middleware.ts` | Next.js 16 deprecates middleware, renamed to proxy |
| base-ui over radix | Next.js 16 + shadcn/ui default; different API constraints |
| PostgreSQL over SQLite | Multi-user production, shared Docker instance |
| PM2 over Docker for app | Simpler deploy, zero-downtime reload, shared server |
| Immutable StockLog | Full audit trail, no data loss on adjustments |
| PropertyStock upsert | Allows tracking stock per property without pre-seeding |
| Compound unique (propertyId, externalUid) | Prevents duplicate iCal bookings |

## 10. Known Constraints

1. **base-ui**: `DropdownMenuLabel` must be inside `DropdownMenuGroup` — throws error #31 otherwise
2. **proxy.ts**: Cannot import `server-only` — runs in Edge runtime
3. **session-crypto.ts**: Shared between Edge (proxy) and Node (API routes) — must stay Edge-compatible
4. **InventoryItem**: Global catalog, not per-user — stock is scoped via PropertyStock → Property → User
5. **MaintenanceTask**: No direct User relation — ownership inferred via propertyId → Property → User
6. **iptables**: Port 3200 must be open for Nginx container to reach the app — rule must persist across reboots
