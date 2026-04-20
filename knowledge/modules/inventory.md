# Module: Inventory

## Responsibility
Master item catalog, per-property stock tracking, stock movements, and low stock alerts.

## Files
- `src/app/api/inventory/items/route.ts` — GET (list with stock), POST (create)
- `src/app/api/inventory/items/[id]/route.ts` — PUT, DELETE
- `src/app/api/inventory/stock/route.ts` — POST (log movement), GET (audit trail)
- `src/app/api/inventory/today/route.ts` — Today's dashboard data
- `src/app/api/inventory/seed/route.ts` — Demo data seeder
- `src/app/api/upload/route.ts` — Image upload for items
- `src/app/inventory/page.tsx` — Inventory hub
- `src/app/inventory/items/page.tsx` — Item CRUD (POS grid)
- `src/app/inventory/counter/page.tsx` — Stock counter (restock/count modes)

## Boundaries
- InventoryItem is a GLOBAL catalog (not per-user) — shared across tenants
- Tenant isolation happens at PropertyStock level: filter by user's property IDs
- Stock movement creates BOTH a PropertyStock upsert AND an immutable StockLog
- StockLog types: RESTOCK, CHECKOUT_USE, MANUAL_USE, ADJUSTMENT, TRANSFER
- Low stock: computed as `totalStock <= minStock` (totalStock = sum of user's PropertyStocks)
- `usagePerCheckout`: auto-deduct amount per guest checkout (0 = manual only)

## Important
- Stock quantity is floored at 0 (never negative)
- StockLogs are immutable — never update or delete
- Corrections use ADJUSTMENT type, not by editing existing logs
