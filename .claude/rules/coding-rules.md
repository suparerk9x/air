# Coding Rules

> Code style and patterns for the Air codebase.

## TypeScript

- Strict mode enabled
- Use `interface` for object shapes, `type` for unions/intersections
- No `any` — use `unknown` and narrow
- API route params: `{ params }: { params: Promise<{ id: string }> }`

## API Routes

- Import helpers from `@/lib/auth-api` (getAuthUserId, verifyPropertyOwnership, unauthorizedResponse, forbiddenResponse)
- Import Prisma from `@/lib/prisma`
- Return `NextResponse.json()` with appropriate status codes
- Wrap handler body in try/catch, catch returns `unauthorizedResponse()`

## Prisma

- Use `findFirst` with `{ id, userId }` instead of `findUnique` + ownership check
- Use `upsert` for PropertyStock (don't assume existence)
- Include related data only when needed (avoid over-fetching)
- Schema changes require migration: `npx prisma migrate dev --name <description>`

## Client Components

- `"use client"` directive at top of file
- Fetch data via `/api/` routes (no direct Prisma imports)
- Use `useCallback` for functions passed to child components
- Server actions imported directly for mutations (e.g., `logout`)

## Styling

- Tailwind CSS classes only (no CSS modules, no styled-components)
- Use `cn()` from `@/lib/utils` for conditional classes
- Colors: use Tailwind defaults, property colors via inline `style`

## Files & Naming

- API routes: `src/app/api/<resource>/route.ts`
- Pages: `src/app/<path>/page.tsx`
- Components: `src/components/<category>/<name>.tsx` (kebab-case)
- Libraries: `src/lib/<name>.ts`
- Server actions: `src/app/actions/<name>.ts`

## After Implementation

- Update `knowledge/feature-map.md` if a feature was added/changed
- Update `knowledge/database-schema.md` if schema changed
- Update relevant `knowledge/modules/<name>.md` if module scope changed
