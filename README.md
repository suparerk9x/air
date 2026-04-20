# Air

Airbnb co-host property & calendar management platform.

**Live:** https://air.lightepic.com

## Features

- **Calendar View** — Monthly and timeline views with drag interactions
- **iCal Sync** — Import bookings from Airbnb, Booking.com via iCal feeds
- **Multi-tenant Auth** — Each co-host sees only their own properties and data
- **Inventory Tracking** — Stock per property, auto-deduct on checkout, low stock alerts
- **Maintenance Tasks** — Track repairs and equipment issues per property
- **Today Panel** — Check-ins, check-outs, and cleaning schedule at a glance

## Tech Stack

- Next.js 16 (App Router)
- PostgreSQL + Prisma ORM
- JWT auth with `jose`
- Tailwind CSS + shadcn/ui
- Deployed on Oracle Cloud ARM with PM2

## Getting Started

```bash
# Install
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev

# Seed demo data
npm run dev
curl -X POST http://localhost:3000/api/seed

# Login with demo@air.local / demo123
```

## Deploy

```bash
bash oracle/scripts/deploy.sh
```

See [oracle/README.md](oracle/README.md) for full deployment documentation.
