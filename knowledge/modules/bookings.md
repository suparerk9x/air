# Module: Bookings

## Responsibility
Guest reservation management — manual creation and iCal-imported bookings.

## Files
- `src/app/api/bookings/route.ts` — GET (list with filters), POST (manual create)
- `src/app/api/bookings/[id]/route.ts` — PATCH (status update), DELETE
- `src/components/calendar/booking-dialog.tsx` — Create booking dialog
- `src/components/calendar/booking-detail-dialog.tsx` — View/edit details

## Boundaries
- Bookings belong to a Property — tenant isolation via `getUserPropertyIds()`
- Status lifecycle: CONFIRMED → CHECKEDIN → CHECKEDOUT (or CANCELLED/BLOCKED)
- Creating a booking requires `verifyPropertyOwnership()` on the propertyId
- iCal-sourced bookings have `source: "ical"` and `externalUid`
