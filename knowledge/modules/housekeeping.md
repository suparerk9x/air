# Module: Housekeeping

## Responsibility
Cleaning task scheduling linked to guest checkouts.

## Files
- Prisma model: `HousekeepingTask` in `prisma/schema.prisma`
- `src/app/api/inventory/today/route.ts` — Today's checkout prep lists
- `src/components/calendar/today-panel.tsx` — Today panel UI

## Boundaries
- HousekeepingTask is 1:1 with Booking (optional)
- Created when a guest checkout is scheduled
- Assigned to a cleaner (free text field, not a system user)
- Status: PENDING → IN_PROGRESS → COMPLETED (or SKIPPED)
- Tenant isolation via `propertyId → property.userId`
