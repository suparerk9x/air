# Database Schema

> Quick reference for AI. Source of truth: `prisma/schema.prisma`

Provider: PostgreSQL  
Config: `prisma.config.ts` (reads DATABASE_URL from env)

## Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| email | String | UNIQUE |
| name | String? | |
| password | String | bcrypt hash |
| role | Role | ADMIN or COHOST |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### properties
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| address | String? | |
| icalUrl | String? | iCal feed URL |
| color | String | default "#3b82f6" |
| platform | String? | airbnb, booking, etc |
| notes | String? | |
| userId | String | FK → users, CASCADE |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### bookings
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| summary | String? | Guest name from iCal |
| startDate | DateTime | |
| endDate | DateTime | |
| status | BookingStatus | CONFIRMED, CHECKEDIN, CHECKEDOUT, CANCELLED, BLOCKED |
| source | String? | "ical" or "manual" |
| externalUid | String? | iCal UID |
| notes | String? | |
| propertyId | String | FK → properties, CASCADE |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Unique constraint:** (propertyId, externalUid)

### housekeeping_tasks
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| date | DateTime | Scheduled cleaning date |
| status | HousekeepingStatus | PENDING, IN_PROGRESS, COMPLETED, SKIPPED |
| assignee | String? | Free text |
| notes | String? | |
| propertyId | String | FK → properties, CASCADE |
| bookingId | String? | FK → bookings, UNIQUE, SetNull |

### inventory_items
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| category | InventoryCategory | LINEN, AMENITY, EQUIPMENT, CONSUMABLE, MAINTENANCE |
| unit | String | default "pcs" |
| description | String? | |
| imageUrl | String? | |
| minStock | Int | default 5, low stock threshold |
| usagePerCheckout | Int | default 0, auto-deduct qty |

### property_stocks
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| quantity | Int | default 0 |
| propertyId | String | FK → properties, CASCADE |
| itemId | String | FK → inventory_items, CASCADE |

**Unique constraint:** (propertyId, itemId)

### stock_logs
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| type | StockLogType | RESTOCK, CHECKOUT_USE, MANUAL_USE, ADJUSTMENT, TRANSFER |
| quantity | Int | positive = in, negative = out |
| note | String? | |
| cost | Float? | Purchase cost for restocks |
| itemId | String | FK → inventory_items, CASCADE |
| propertyId | String? | null = central warehouse |
| bookingId | String? | Link to auto-deduct source |
| createdAt | DateTime | Immutable |

### maintenance_tasks
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| title | String | |
| description | String? | |
| status | MaintenanceStatus | OPEN, IN_PROGRESS, COMPLETED, CANCELLED |
| priority | MaintenancePriority | LOW, MEDIUM, HIGH, URGENT |
| dueDate | DateTime? | |
| completedAt | DateTime? | |
| cost | Float? | |
| assignee | String? | |
| propertyId | String | FK (no relation in Prisma) |
| itemId | String? | Link to inventory item |

## Tenant Isolation Patterns

```typescript
// Direct ownership
prisma.property.findMany({ where: { userId } })

// Via property chain
const propertyIds = await getUserPropertyIds(userId);
prisma.booking.findMany({ where: { propertyId: { in: propertyIds } } })

// Before mutation
if (!(await verifyPropertyOwnership(propertyId, userId))) return 403;
```
