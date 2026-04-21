# Feature Map

> Source of truth for what the system can do. AI must read this before implementing any feature.

Last updated: 2026-04-20

## Auth Module

| Feature | Route/File | Description |
|---------|-----------|-------------|
| Login | `/login`, `actions/auth.ts` | Email + password, bcrypt, creates JWT session |
| Register | `/register`, `actions/auth.ts` | Create account, auto-login |
| Logout | `actions/auth.ts` | Delete session cookie, redirect to /login |
| Session management | `lib/session.ts`, `lib/session-crypto.ts` | JWT in HttpOnly cookie, 7-day expiry |
| Route protection | `proxy.ts` | Redirect unauthenticated to /login |
| Current user | `GET /api/auth/me` | Return user profile |

## Properties Module

| Feature | Route/File | Description |
|---------|-----------|-------------|
| List properties | `GET /api/properties` | User's properties with bookings, tenant-filtered |
| Create property | `POST /api/properties` | Name, address, icalUrl, color, platform |
| Update property | `PUT /api/properties/[id]` | Ownership verified |
| Delete property | `DELETE /api/properties/[id]` | Cascades bookings, ownership verified |
| iCal sync | `POST /api/properties/[id]/sync` | Fetch iCal feed, upsert bookings by externalUid |

## Bookings Module

| Feature | Route/File | Description |
|---------|-----------|-------------|
| List bookings | `GET /api/bookings` | Filter by date range, propertyId. Tenant-scoped |
| Create booking | `POST /api/bookings` | Manual booking, verify property ownership |
| Update booking | `PATCH /api/bookings/[id]` | Status change (Confirmed → CheckedIn → CheckedOut) |
| Delete booking | `DELETE /api/bookings/[id]` | Ownership via property chain |

## Inventory Module

| Feature | Route/File | Description |
|---------|-----------|-------------|
| List items | `GET /api/inventory/items` | Master catalog with stock per user's properties |
| Create item | `POST /api/inventory/items` | Name, category, unit, minStock, usagePerCheckout |
| Update item | `PUT /api/inventory/items/[id]` | Auth required |
| Delete item | `DELETE /api/inventory/items/[id]` | Auth required |
| Stock movement | `POST /api/inventory/stock` | Upsert PropertyStock + create StockLog |
| Stock logs | `GET /api/inventory/stock` | Audit trail, tenant-filtered |
| Low stock detection | Computed in GET items | totalStock <= minStock |
| Auto-deduct | Via stock POST with type CHECKOUT_USE | Linked to bookingId |
| Stock counter page | `/inventory/counter` | POS-style split-screen: left grid (tap-to-count), right list with +/-, progress bar, variance display |
| Items setup page | `/inventory/items` | CRUD with image upload |
| Image upload | `POST /api/upload` | Multipart form, saves to /public/uploads |

## Housekeeping Module

| Feature | Route/File | Description |
|---------|-----------|-------------|
| Housekeeping tasks | Prisma model `HousekeepingTask` | Linked to booking + property |
| Today panel | `GET /api/inventory/today` | Check-ins, check-outs, prep lists |

## Maintenance Module

| Feature | Route/File | Description |
|---------|-----------|-------------|
| List tasks | `GET /api/inventory/maintenance` | Tenant-filtered via property ownership |
| Create task | `POST /api/inventory/maintenance` | Title, priority, assignee, property |
| Update task | `PATCH /api/inventory/maintenance/[id]` | Status, cost, assignee |
| Delete task | `DELETE /api/inventory/maintenance/[id]` | Ownership verified |

## Calendar/UI Module

| Feature | Route/File | Description |
|---------|-----------|-------------|
| Monthly calendar | `page.tsx` + `calendar-grid.tsx` | Grid view with booking bars |
| Timeline view | `page.tsx` + `timeline-view.tsx` | Gantt-style horizontal |
| Property sidebar | `property-sidebar.tsx` | Multi-select filter |
| Stats bar | `stats-bar.tsx` | Occupancy, booked nights, avg stay |
| Today panel | `today-panel.tsx` | Check-in/out/staying |
| Notifications | `page.tsx` dropdown | Tomorrow's check-ins/outs |
| Sync button | `page.tsx` | Manual iCal sync with timestamp |
| User menu | `page.tsx` dropdown | Profile, logout |

## Seed/Demo

| Feature | Route/File | Description |
|---------|-----------|-------------|
| Seed data | `POST /api/seed` | Demo user + 3 properties + bookings |
| Seed inventory | `POST /api/inventory/seed` | 23 items + stock + maintenance tasks |
