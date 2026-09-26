-- ============================================================================
-- Transport Price Finder — Initial Schema
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fast fuzzy location search

-- ----------------------------------------------------------------------------
-- profiles: extends auth.users with role info (admin authorization)
-- ----------------------------------------------------------------------------
create type public.app_role as enum ('super_admin', 'admin', 'editor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'editor',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- locations
-- ----------------------------------------------------------------------------
create table public.locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null,
  description text,
  city text not null default 'Addis Ababa',
  latitude double precision,
  longitude double precision,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_slug_city_unique unique (slug, city)
);

create index locations_name_trgm_idx on public.locations using gin (name gin_trgm_ops);
create index locations_active_idx on public.locations (is_active);

-- ----------------------------------------------------------------------------
-- transport_types
-- ----------------------------------------------------------------------------
create table public.transport_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- route_prices
-- A route is directional: (from_location, to_location, transport_type) is
-- unique among ACTIVE rows, enforced via a partial unique index so an old
-- deactivated route doesn't block re-adding a route with the same endpoints.
-- ----------------------------------------------------------------------------
create table public.route_prices (
  id uuid primary key default uuid_generate_v4(),
  from_location_id uuid not null references public.locations(id) on delete restrict,
  to_location_id uuid not null references public.locations(id) on delete restrict,
  transport_type_id uuid not null references public.transport_types(id) on delete restrict,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'ETB',
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint route_prices_no_self_route check (from_location_id <> to_location_id)
);

-- Prevent duplicate ACTIVE routes for the same from/to/transport combination
create unique index route_prices_unique_active_route
  on public.route_prices (from_location_id, to_location_id, transport_type_id)
  where (is_active = true);

create index route_prices_from_idx on public.route_prices (from_location_id);
create index route_prices_to_idx on public.route_prices (to_location_id);
create index route_prices_lookup_idx on public.route_prices (from_location_id, to_location_id, is_active);

-- ----------------------------------------------------------------------------
-- price_history
-- ----------------------------------------------------------------------------
create table public.price_history (
  id uuid primary key default uuid_generate_v4(),
  route_price_id uuid not null references public.route_prices(id) on delete cascade,
  old_price numeric(10, 2),
  new_price numeric(10, 2) not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  reason text
);

create index price_history_route_idx on public.price_history (route_price_id, changed_at desc);

-- ----------------------------------------------------------------------------
-- search_logs (anonymous analytics)
-- ----------------------------------------------------------------------------
create table public.search_logs (
  id uuid primary key default uuid_generate_v4(),
  from_location_id uuid references public.locations(id) on delete set null,
  to_location_id uuid references public.locations(id) on delete set null,
  found_result boolean not null default true,
  searched_at timestamptz not null default now()
);

create index search_logs_route_idx on public.search_logs (from_location_id, to_location_id);
create index search_logs_date_idx on public.search_logs (searched_at);

-- ----------------------------------------------------------------------------
-- route_reports (missing route submissions from the public)
-- ----------------------------------------------------------------------------
create type public.report_status as enum ('pending', 'reviewed', 'added', 'rejected');

create table public.route_reports (
  id uuid primary key default uuid_generate_v4(),
  from_location text not null,
  to_location text not null,
  suggested_price numeric(10, 2),
  message text,
  status public.report_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index route_reports_status_idx on public.route_reports (status);

-- ----------------------------------------------------------------------------
-- admin_activity_logs
-- ----------------------------------------------------------------------------
create table public.admin_activity_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id),
  action text not null,               -- e.g. 'route.created', 'route.price_changed'
  entity_type text not null,          -- e.g. 'route_price', 'location'
  entity_id uuid,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_activity_logs_entity_idx on public.admin_activity_logs (entity_type, entity_id);
create index admin_activity_logs_date_idx on public.admin_activity_logs (created_at desc);

-- ============================================================================
-- Triggers: updated_at maintenance
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_locations_updated_at before update on public.locations
  for each row execute function public.set_updated_at();
create trigger trg_transport_types_updated_at before update on public.transport_types
  for each row execute function public.set_updated_at();
create trigger trg_route_prices_updated_at before update on public.route_prices
  for each row execute function public.set_updated_at();
create trigger trg_route_reports_updated_at before update on public.route_reports
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user is created (admins are
-- provisioned manually via Supabase Auth + this trigger sets default role).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'editor');
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Log price changes into price_history automatically
create or replace function public.log_price_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'UPDATE' and old.price is distinct from new.price) then
    insert into public.price_history (route_price_id, old_price, new_price, changed_by)
    values (new.id, old.price, new.price, new.updated_by);
  elsif (tg_op = 'INSERT') then
    insert into public.price_history (route_price_id, old_price, new_price, changed_by)
    values (new.id, null, new.price, new.created_by);
  end if;
  return new;
end;
$$;

create trigger trg_route_prices_log_change
  after insert or update on public.route_prices
  for each row execute function public.log_price_change();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.transport_types enable row level security;
alter table public.route_prices enable row level security;
alter table public.price_history enable row level security;
alter table public.search_logs enable row level security;
alter table public.route_reports enable row level security;
alter table public.admin_activity_logs enable row level security;

-- Helper: is the current user an active admin/editor?
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

-- profiles: users can read their own profile; admins can read all
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- locations: public read (active only); admin full access
create policy "locations_public_read" on public.locations
  for select using (is_active = true or public.is_admin());
create policy "locations_admin_write" on public.locations
  for insert with check (public.is_admin());
create policy "locations_admin_update" on public.locations
  for update using (public.is_admin());
create policy "locations_admin_delete" on public.locations
  for delete using (public.is_admin());

-- transport_types: public read (active only); admin full access
create policy "transport_types_public_read" on public.transport_types
  for select using (is_active = true or public.is_admin());
create policy "transport_types_admin_write" on public.transport_types
  for insert with check (public.is_admin());
create policy "transport_types_admin_update" on public.transport_types
  for update using (public.is_admin());
create policy "transport_types_admin_delete" on public.transport_types
  for delete using (public.is_admin());

-- route_prices: public read (active only); admin full access
create policy "route_prices_public_read" on public.route_prices
  for select using (is_active = true or public.is_admin());
create policy "route_prices_admin_write" on public.route_prices
  for insert with check (public.is_admin());
create policy "route_prices_admin_update" on public.route_prices
  for update using (public.is_admin());
create policy "route_prices_admin_delete" on public.route_prices
  for delete using (public.is_admin());

-- price_history: admin read only
create policy "price_history_admin_read" on public.price_history
  for select using (public.is_admin());
create policy "price_history_system_insert" on public.price_history
  for insert with check (true); -- inserted only via trigger (security definer not needed; table has RLS on select)

-- search_logs: anyone can insert (anonymous logging); admin can read
create policy "search_logs_public_insert" on public.search_logs
  for insert with check (true);
create policy "search_logs_admin_read" on public.search_logs
  for select using (public.is_admin());

-- route_reports: anyone can insert; admin can read/update
create policy "route_reports_public_insert" on public.route_reports
  for insert with check (true);
create policy "route_reports_admin_read" on public.route_reports
  for select using (public.is_admin());
create policy "route_reports_admin_update" on public.route_reports
  for update using (public.is_admin());

-- admin_activity_logs: admin read; inserted by server using service role or admin session
create policy "admin_activity_logs_admin_read" on public.admin_activity_logs
  for select using (public.is_admin());
create policy "admin_activity_logs_admin_insert" on public.admin_activity_logs
  for insert with check (public.is_admin());
