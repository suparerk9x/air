# Module: Maintenance

## Responsibility
Tracking repair and maintenance tasks per property.

## Files
- `src/app/api/inventory/maintenance/route.ts` — GET (list), POST (create)
- `src/app/api/inventory/maintenance/[id]/route.ts` — PATCH, DELETE

## Boundaries
- MaintenanceTask has NO direct User relation — ownership inferred via `propertyId`
- Tenant isolation: filter by `propertyId: { in: userPropertyIds }`
- Priority: LOW, MEDIUM, HIGH, URGENT
- Status: OPEN → IN_PROGRESS → COMPLETED (or CANCELLED)
- Optional link to InventoryItem via `itemId`
- Tracks cost and assignee (free text)
