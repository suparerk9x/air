# Domain Model

> Business concepts and their relationships in the Air co-hosting domain.

## Core Entities

### User (Tenant Root)
A co-host who manages properties. Each user is a tenant — they only see their own data. Roles: ADMIN (full access) or COHOST (standard).

### Property
A physical accommodation unit (apartment, condo, house) managed by a User. Has a color for calendar display and optional iCal URL for external booking sync. Platform tag indicates source (Airbnb, Booking.com, etc).

### Booking
A guest reservation at a Property. Can come from iCal sync (with externalUid for deduplication) or manual entry. Status lifecycle: CONFIRMED → CHECKEDIN → CHECKEDOUT. Can also be BLOCKED (owner block) or CANCELLED.

### HousekeepingTask
A cleaning task generated when a guest checks out. Linked 1:1 to a Booking. Assigned to a cleaner (free text, not a system user). Status: PENDING → IN_PROGRESS → COMPLETED.

### InventoryItem
A product in the master catalog. Categories: LINEN (bed sheets, towels), AMENITY (soap, coffee), EQUIPMENT (remotes, keys), CONSUMABLE (trash bags, tissues), MAINTENANCE (light bulbs, filters). Has `usagePerCheckout` for auto-deduction and `minStock` for alerts.

### PropertyStock
Quantity of an InventoryItem at a specific Property. Compound unique (propertyId, itemId). Incremented/decremented by stock movements.

### StockLog
Immutable audit trail of every stock movement. Types: RESTOCK (purchased), CHECKOUT_USE (auto-deduct), MANUAL_USE (damaged/lost), ADJUSTMENT (physical count correction), TRANSFER (between properties). Links to InventoryItem, optionally to Property and Booking.

### MaintenanceTask
A repair or maintenance job at a Property. Priority: LOW/MEDIUM/HIGH/URGENT. Can link to an InventoryItem (e.g., "replace AC filter"). Tracks cost and assignee.

## Ownership Chain

```
User
 └── Property
      ├── Booking
      │    └── HousekeepingTask (1:1)
      ├── PropertyStock ──▶ InventoryItem ──▶ StockLog
      └── MaintenanceTask
```

All tenant isolation flows through this chain: `resource → property.userId === currentUser.id`

## Key Business Rules

1. One user can manage many properties
2. A booking belongs to exactly one property
3. iCal bookings are deduplicated by (propertyId, externalUid)
4. Stock is tracked per property, not globally
5. Auto-deduct happens when a booking status becomes CHECKEDOUT
6. Low stock = totalStock across user's properties <= item.minStock
7. StockLogs are immutable — corrections use ADJUSTMENT type
8. MaintenanceTask has no direct User relation — ownership via property
9. InventoryItem is a global catalog (shared across tenants) — stock is per-tenant via PropertyStock
