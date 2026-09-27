import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const search = request.nextUrl.searchParams.get("q")?.trim();
  const transportType = request.nextUrl.searchParams.get("type")?.trim();

  let query = supabase
    .from("route_prices")
    .select(
      `
      id,
      price,
      currency,
      notes,
      updated_at,
      from_location:from_location_id (id, name, city),
      to_location:to_location_id (id, name, city),
      transport_type:transport_type_id (id, name, icon)
    `
    )
    .eq("is_active", true)
    .order("price", { ascending: true });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to load routes directory." }, { status: 500 });
  }

  let filtered = data ?? [];

  if (transportType && transportType !== "all") {
    filtered = filtered.filter(
      (r: any) => r.transport_type?.name?.toLowerCase() === transportType.toLowerCase()
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((r: any) => {
      const fromName = r.from_location?.name?.toLowerCase() ?? "";
      const toName = r.to_location?.name?.toLowerCase() ?? "";
      const typeName = r.transport_type?.name?.toLowerCase() ?? "";
      return fromName.includes(q) || toName.includes(q) || typeName.includes(q);
    });
  }

  return NextResponse.json({ routes: filtered });
}
