-- ============================================================================
-- Convenience RPC functions used by the API layer
-- ============================================================================

-- Fast location autocomplete (name or slug, trigram similarity + prefix boost)
create or replace function public.search_locations(q text, max_results int default 8)
returns setof public.locations
language sql stable as $$
  select *
  from public.locations
  where is_active = true
    and (name ilike q || '%' or name ilike '%' || q || '%')
  order by
    (name ilike q || '%') desc,          -- prefix matches first
    similarity(name, q) desc,
    name asc
  limit max_results;
$$;

-- Look up the active price(s) for a directional route, across transport types
create or replace function public.get_route_price(from_id uuid, to_id uuid)
returns table (
  route_price_id uuid,
  transport_type text,
  transport_icon text,
  price numeric,
  currency text,
  notes text,
  updated_at timestamptz
)
language sql stable as $$
  select
    rp.id,
    tt.name,
    tt.icon,
    rp.price,
    rp.currency,
    rp.notes,
    rp.updated_at
  from public.route_prices rp
  join public.transport_types tt on tt.id = rp.transport_type_id
  where rp.from_location_id = from_id
    and rp.to_location_id = to_id
    and rp.is_active = true
    and tt.is_active = true
  order by rp.price asc;
$$;

-- Most searched routes in the last N days, for the public "Popular Routes"
-- section and the admin analytics dashboard.
create or replace function public.get_popular_routes(days_back int default 30, max_results int default 8)
returns table (
  from_location_id uuid,
  from_name text,
  to_location_id uuid,
  to_name text,
  search_count bigint,
  min_price numeric,
  currency text
)
language sql stable as $$
  select
    sl.from_location_id,
    fl.name,
    sl.to_location_id,
    tl.name,
    count(*) as search_count,
    min(rp.price) as min_price,
    min(rp.currency) as currency
  from public.search_logs sl
  join public.locations fl on fl.id = sl.from_location_id
  join public.locations tl on tl.id = sl.to_location_id
  left join public.route_prices rp
    on rp.from_location_id = sl.from_location_id
    and rp.to_location_id = sl.to_location_id
    and rp.is_active = true
  where sl.searched_at >= now() - (days_back || ' days')::interval
    and sl.from_location_id is not null
    and sl.to_location_id is not null
  group by sl.from_location_id, fl.name, sl.to_location_id, tl.name
  order by search_count desc
  limit max_results;
$$;

grant execute on function public.search_locations(text, int) to anon, authenticated;
grant execute on function public.get_route_price(uuid, uuid) to anon, authenticated;
grant execute on function public.get_popular_routes(int, int) to anon, authenticated;
