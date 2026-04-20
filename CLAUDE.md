@AGENTS.md

# Air — Airbnb Co-host Property & Calendar Management

## What is this project?

A multi-tenant property management app for Airbnb co-hosts. Part of "The End-to-End Scalable Co-Hosting System" — see [docs/system-overview.md](docs/system-overview.md) for the full vision.

Each user sees only their own properties, bookings, and inventory. Built with Next.js 16, Prisma, PostgreSQL.

Live at: https://air.lightepic.com

## Tech Stack

- **Framework:** Next.js 16 (App Router) — uses `proxy.ts` instead of `middleware.ts`
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT sessions with `jose`, stored in HttpOnly cookies. No next-auth.
- **UI:** shadcn/ui components (base-ui, NOT radix — avoid `DropdownMenuLabel` outside `DropdownMenuGroup`)
- **Styling:** Tailwind CSS

## Key Architecture

### Authentication Flow
- `src/lib/session-crypto.ts` — JWT encrypt/decrypt (Edge-compatible, used by proxy)
- `src/lib/session.ts` — Cookie management (server-only)
- `src/lib/auth-api.ts` — `getAuthUserId()` helper for API routes
- `src/proxy.ts` — Route protection (redirects to /login if unauthenticated)
- `src/app/actions/auth.ts` — Server actions: login, register, logout

### Multi-tenant Isolation
Every API route calls `getAuthUserId()` and filters data by the authenticated user's properties. Property ownership is verified before any CRUD operation.

### File Structure
```
src/
├── app/
│   ├── page.tsx              # Main dashboard (calendar, timeline, stats)
│   ├── login/page.tsx        # Login page
│   ├── register/page.tsx     # Register page
│   ├── inventory/            # Inventory management pages
│   ├── api/                  # API routes (all tenant-isolated)
│   └── actions/auth.ts       # Server actions
├── components/
│   ├── calendar/             # Calendar, timeline, booking dialogs
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── session.ts            # Session management
│   ├── session-crypto.ts     # JWT crypto (Edge-safe)
│   ├── auth-api.ts           # API auth helpers
│   ├── ical.ts               # iCal feed parser
│   └── types.ts              # Shared types
└── proxy.ts                  # Next.js 16 middleware (route protection)
```

## Development

```bash
# Local dev (needs SSH tunnel to Oracle PostgreSQL)
ssh -L 5433:172.18.0.8:5432 -i oracle/.ssh/oracle-arm.key ubuntu@161.33.204.39 -N &
npm run dev

# Seed demo data
curl -X POST http://localhost:3000/api/seed
# Login: demo@air.local / demo123
```

## Deployment

```bash
# One-command deploy to Oracle Cloud
bash oracle/scripts/deploy.sh
```

See `oracle/README.md` for full deployment docs.

## Devatar Framework

This project uses **Devatar Activation Level 2** (Early Product + Architecture Risk Override for multi-tenant).

Before implementing ANY feature:
1. Read `knowledge/feature-map.md` — does this feature already exist?
2. Read `knowledge/database-schema.md` — what tables are involved?
3. Read `.claude/rules/architecture-rules.md` — follow tenant isolation patterns
4. Read the relevant `knowledge/modules/<name>.md`
5. After implementation: update feature-map and module knowledge

See `knowledge/devatar-activation-report.md` for full activation details.

## Important Notes

- base-ui components: `DropdownMenuLabel` MUST be inside `DropdownMenuGroup`, otherwise throws error #31
- Next.js 16: Uses `proxy.ts` (not `middleware.ts`), exports named `proxy` function
- `session-crypto.ts` must NOT import `server-only` — it's used by proxy which runs in Edge
- Prisma schema uses `postgresql` provider, NOT sqlite
