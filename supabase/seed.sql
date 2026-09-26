-- ============================================================================
-- Seed data
-- Transport types are safe defaults. Locations & route_prices are left as a
-- template — replace the sample rows below with your real list, then run:
--   supabase db reset   (local)  or  psql < supabase/seed.sql  (remote)
-- ============================================================================

insert into public.transport_types (name, slug, icon, sort_order) values
  ('Taxi',        'taxi',        'car',   1),
  ('Shared Taxi', 'shared-taxi', 'users', 2),
  ('Minibus',     'minibus',     'bus',   3),
  ('Bus',         'bus',         'bus',   4),
  ('Other',       'other',       'more-horizontal', 5)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- TODO: replace with your real locations. slug = lowercase, hyphenated.
-- ----------------------------------------------------------------------------
insert into public.locations (name, slug, city) values
  ('Jemo',   'jemo',   'Addis Ababa'),
  ('Mexico', 'mexico', 'Addis Ababa'),
  ('Bole',   'bole',   'Addis Ababa'),
  ('Piassa', 'piassa', 'Addis Ababa')
on conflict (slug, city) do nothing;

-- ----------------------------------------------------------------------------
-- TODO: replace with your real routes & prices. transport_type must match a
-- name/slug in transport_types above.
-- ----------------------------------------------------------------------------
with tt as (select id, slug from public.transport_types),
     loc as (select id, slug from public.locations)
insert into public.route_prices (from_location_id, to_location_id, transport_type_id, price, currency)
select
  (select id from loc where slug = r.from_slug),
  (select id from loc where slug = r.to_slug),
  (select id from tt where slug = r.type_slug),
  r.price,
  'ETB'
from (values
  ('jemo', 'mexico', 'taxi', 50),
  ('bole', 'piassa', 'taxi', 100)
) as r(from_slug, to_slug, type_slug, price)
on conflict do nothing;
