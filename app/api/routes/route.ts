import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Popular routes, ranked by recent search volume (falls back to newest active routes). */
export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 6);
  const supabase = createClient();

  const { data: popular, error } = await supabase.rpc("get_popular_routes", {
    days_back: 30,
    max_results: limit,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to load routes." }, { status: 500 });
  }

  if (popular && popular.length > 0) {
    return NextResponse.json({ routes: popular, source: "search_activity" });
  }

  // Fallback for a fresh database with no search history yet: show the
  // most recently added active routes instead.
  const { data: fallback } = await supabase
    .from("route_prices")
    .select(
      "id, price, currency, from_location:from_location_id(id, name), to_location:to_location_id(id, name)"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  const routes = (fallback ?? []).map((r: any) => ({
    from_location_id: r.from_location?.id,
    from_name: r.from_location?.name,
    to_location_id: r.to_location?.id,
    to_name: r.to_location?.name,
    search_count: 0,
    min_price: r.price,
    currency: r.currency,
  }));

  return NextResponse.json({ routes, source: "recent_routes" });
}
