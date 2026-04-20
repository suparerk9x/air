# Architecture Rules

> Machine-verifiable rules for the Air codebase. Violations must be flagged before implementation.

## 1. Multi-tenant Isolation (CRITICAL)

Every API route that reads or writes data MUST:
- Call `getAuthUserId()` from `@/lib/auth-api`
- Filter queries by the authenticated user's properties
- Return 401 if not authenticated, 403 if not authorized
- NEVER trust `userId` from request body — always derive from session

### Patterns

```typescript
// Direct property access
const properties = await prisma.property.findMany({ where: { userId } });

// Nested resource access
const userPropertyIds = await getUserPropertyIds(userId);
const bookings = await prisma.booking.findMany({
  where: { propertyId: { in: userPropertyIds } }
});

// Before mutation on nested resource
if (!(await verifyPropertyOwnership(propertyId, userId))) {
  return forbiddenResponse();
}
```

## 2. API Route Structure

Every API route handler follows this shape:
```typescript
export async function METHOD(req) {
  try {
    const userId = await getAuthUserId();
    // ... business logic with tenant filtering ...
    return NextResponse.json(data);
  } catch {
    return unauthorizedResponse();
  }
}
```

Exceptions: `POST /api/seed` (dev only), public health checks.

## 3. Session Architecture

- `session-crypto.ts` — Edge-compatible, NO `server-only` import
- `session.ts` — Node-only, imports `server-only`
- `proxy.ts` imports from `session-crypto.ts` (not `session.ts`)
- API routes import from `auth-api.ts` (which uses `session-crypto.ts`)

Never mix Edge and Node-only code in the same file.

## 4. Database Mutations

- Never delete StockLog entries — they are immutable audit records
- Use ADJUSTMENT type to correct stock discrepancies
- PropertyStock quantity must never go below 0
- Always upsert PropertyStock (don't assume it exists)

## 5. UI Components

- Use base-ui components (shadcn/ui in this project uses base-ui, NOT radix)
- `DropdownMenuLabel` MUST be inside `DropdownMenuGroup` (base-ui error #31)
- When in doubt, use plain `<div>` instead of semantic menu components

## 6. Next.js 16

- Route protection uses `proxy.ts` (NOT `middleware.ts` — deprecated)
- `proxy.ts` exports a named `proxy` function
- Server actions use `"use server"` directive
- `params` in route handlers is a `Promise` — must `await params`

## 7. New Module Creation

Before creating a new module:
1. Check `knowledge/feature-map.md` — does this feature already exist?
2. Can it be added to an existing module instead?
3. If new module is justified, create `knowledge/modules/<name>.md`
4. Update `knowledge/feature-map.md` with new features
