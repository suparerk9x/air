# Air — Knowledge Index

> Read this first. Points to all knowledge files in the system.

## Devatar Activation

- **Level:** 2 (Early Product + Architecture Risk Override for multi-tenant)
- **Report:** [devatar-activation-report.md](devatar-activation-report.md)

## Knowledge Files

| File | Purpose |
|------|---------|
| [feature-map.md](feature-map.md) | What the system can do — read before implementing anything |
| [domain-model.md](domain-model.md) | Business entities and relationships |
| [database-schema.md](database-schema.md) | Quick schema reference (source: prisma/schema.prisma) |

## Module Knowledge

| Module | File | Features |
|--------|------|----------|
| Auth | [modules/auth.md](modules/auth.md) | Login, register, sessions, route protection |
| Properties | [modules/properties.md](modules/properties.md) | Property CRUD, iCal sync |
| Bookings | [modules/bookings.md](modules/bookings.md) | Booking CRUD, status lifecycle |
| Inventory | [modules/inventory.md](modules/inventory.md) | Items, stock, auto-deduct, alerts |
| Housekeeping | [modules/housekeeping.md](modules/housekeeping.md) | Cleaning tasks |
| Maintenance | [modules/maintenance.md](modules/maintenance.md) | Repair tasks |
| Calendar/UI | [modules/calendar-ui.md](modules/calendar-ui.md) | Dashboard, views, components |

## Architecture Rules

| File | Purpose |
|------|---------|
| `.claude/rules/architecture-rules.md` | Multi-tenant isolation, API patterns, session architecture |
| `.claude/rules/coding-rules.md` | TypeScript, Prisma, styling, naming conventions |

## Source of Truth (docs/)

| File | Purpose |
|------|---------|
| `docs/prd.md` | Product requirements, features, user flows |
| `docs/architecture.md` | System design, data model, deployment |
| `docs/system-overview.md` | Vision — End-to-End Scalable Co-Hosting System |
| `docs/The-Devatar-Framework.md` | Framework specification (do not modify) |
