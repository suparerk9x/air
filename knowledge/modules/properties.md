# Module: Properties

## Responsibility
CRUD for properties and iCal feed synchronization.

## Files
- `src/app/api/properties/route.ts` — GET (list), POST (create)
- `src/app/api/properties/[id]/route.ts` — GET, PUT, DELETE
- `src/app/api/properties/[id]/sync/route.ts` — POST iCal sync
- `src/lib/ical.ts` — iCal feed parser
- `src/components/calendar/property-sidebar.tsx` — Property list UI
- `src/components/calendar/property-dialog.tsx` — Create/edit dialog

## Boundaries
- Properties are the tenant boundary — every resource links to a property → user
- GET list always filters by `userId`
- PUT/DELETE always verify ownership via `verifyPropertyOwnership()`
- iCal sync uses `externalUid` compound unique to prevent duplicates
