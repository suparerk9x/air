# Module: Calendar & UI

## Responsibility
Main dashboard with calendar views, stats, notifications, and user interface.

## Files
- `src/app/page.tsx` — Dashboard (client component, main entry point)
- `src/components/calendar/calendar-grid.tsx` — Monthly grid view
- `src/components/calendar/timeline-view.tsx` — Timeline/Gantt view
- `src/components/calendar/property-sidebar.tsx` — Multi-select property filter
- `src/components/calendar/stats-bar.tsx` — Occupancy, booked nights, avg stay
- `src/components/calendar/today-panel.tsx` — Today's check-ins/outs/staying
- `src/components/calendar/booking-dialog.tsx` — Create booking
- `src/components/calendar/booking-detail-dialog.tsx` — View/edit booking
- `src/components/calendar/property-dialog.tsx` — Create/edit property
- `src/components/ui/` — shadcn/ui base components

## Boundaries
- All data fetched via `/api/` routes (no direct Prisma in client)
- User info from `/api/auth/me`
- Logout via server action import
- UI components use base-ui (NOT radix) — different API constraints
- `DropdownMenuLabel` must be inside `DropdownMenuGroup` (base-ui error #31)
