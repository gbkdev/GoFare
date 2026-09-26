# GoFare — Transport Price Finder

A mobile-first platform to look up the known transport price between two
locations. Passengers search **From → To** and get a price; admins manage the
underlying locations, routes and prices from a separate dashboard.

This is **not** a booking app — no driver matching, payments, or live
tracking. See the project spec for full rationale.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Row Level Security)
- Deploy target: Vercel + Supabase

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init.sql` — schema, triggers, RLS policies
   - `supabase/migrations/0002_functions.sql` — search/lookup RPC functions
3. Edit `supabase/seed.sql` with your real locations and route prices
   (the sample rows are placeholders), then run it.
4. Copy `.env.example` to `.env.local` and fill in your project's URL and
   keys (Project Settings → API).

## 2. Create your first admin user

Admins sign in with normal Supabase email/password auth, but need an
**active** row in `profiles` with a role of `admin` or `super_admin` to reach
`/admin`. Every new auth user automatically gets a `profiles` row with role
`editor` via a trigger — promote yourself after signing up once:

```sql
-- Run in the Supabase SQL editor after creating your account
-- (Authentication → Users → Add user, or sign up once via your own script)
update public.profiles
set role = 'super_admin'
where id = 'the-user-id-from-auth.users';
```

`is_active = false` on a profile immediately locks that admin out — the
middleware checks it on every `/admin` and `/api/admin/*` request.

## 3. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` for the public site and
`http://localhost:3000/admin/login` for the dashboard.

## 4. Deploy

- Push to GitHub, import into Vercel, add the same environment variables.
- Supabase migrations are not auto-applied by Vercel — run them against your
  production project via the SQL editor or the Supabase CLI
  (`supabase db push`) as part of your release process.

## Project structure

```
app/
  page.tsx                 Public homepage (search → price)
  about/                    About page
  admin/
    login/                  Public login (no sidebar)
    (dashboard)/            Protected admin pages (sidebar layout)
      page.tsx              Overview / stats
      locations/            Location CRUD
      routes/                Route & price CRUD + price history
      transport-types/       Transport type management
      reports/               Missing-route report triage
      analytics/              Popular-route chart
  api/
    locations/               Public location list + autocomplete
    routes/                  Popular routes, price lookup, missing-route reports
    admin/                    Authenticated CRUD + activity logging
components/
  public/                    Search UI, price card, popular routes, etc.
  admin/                      Sidebar, modal
lib/
  supabase/                  Browser/server/service-role clients
  types.ts                    Shared domain types
  admin/activity.ts           Audit-log helper
supabase/
  migrations/                  SQL schema, RLS, RPC functions
  seed.sql                     Starter data — replace with your real list
middleware.ts                  Session refresh + /admin & /api/admin auth guard
```

## JSON import

Both the **Locations** and **Routes & Prices** admin pages have an "Import
JSON" button next to "Add". Each accepts a `.json` file containing an array
of records (the modal shows the expected shape):

```json
// Locations
[{ "name": "Jemo", "city": "Addis Ababa" }]

// Routes
[{ "from_location": "Jemo", "to_location": "Mexico", "transport_type": "Taxi", "price": 50 }]
```

Imports are **additive only** — nothing existing is edited or removed.
Duplicate locations (same name + city) and duplicate active routes (same
from/to/transport type) are skipped automatically, and the modal reports how
many rows were imported vs. skipped, with reasons for routes (unknown
location, unknown transport type, etc). Route imports match `from_location`,
`to_location` and `transport_type` by name against what already exists, so
add any new locations or transport types first if your file references ones
that don't exist yet.

## Key design decisions

- **Directional routes**: `Jemo → Mexico` and `Mexico → Jemo` are distinct
  rows; a route in one direction never implies pricing for the other.
- **Duplicate prevention**: a partial unique index on
  `(from_location_id, to_location_id, transport_type_id)` where `is_active =
  true` blocks accidental duplicate *active* routes, while still letting you
  deactivate one and add a fresh replacement.
- **Soft deletion**: locations and routes are deactivated (`is_active =
  false`), never hard-deleted, so price history and search analytics stay
  intact.
- **Automatic price history**: a database trigger writes to `price_history`
  on every insert/update of `route_prices.price` — the API can't forget to
  log a change.
- **RLS-first security**: every table has Row Level Security enabled; the
  public API relies on Postgres policies (not just app code) to keep writes
  admin-only and reads limited to active rows.

## What's next (V2, not built here)

Interactive map, user accounts/favorites, multi-language support (Amharic,
Afaan Oromo, Tigrinya), more transport categories, and a mobile app — see the
original spec for the full V2 list. The schema (directional routes, per-type
pricing) was designed so these can be layered on without a rebuild.
