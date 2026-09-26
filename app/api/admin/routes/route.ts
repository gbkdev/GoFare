import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const routeSchema = z.object({
  from_location_id: z.string().uuid(),
  to_location_id: z.string().uuid(),
  transport_type_id: z.string().uuid(),
  price: z.number().min(0).max(1_000_000),
  currency: z.string().trim().length(3).default("ETB"),
  notes: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? 20);
  const status = request.nextUrl.searchParams.get("status"); // active | inactive | all
  const search = request.nextUrl.searchParams.get("q");

  let query = supabase
    .from("route_prices")
    .select(
      "id, price, currency, notes, is_active, updated_at, from_location:from_location_id(id, name), to_location:to_location_id(id, name), transport_type:transport_type_id(id, name, icon)",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: "Failed to load routes." }, { status: 500 });

  // Simple client-side-style filter on joined names since Postgrest can't
  // filter on a joined column with ilike in one query easily here.
  const filtered = search
    ? (data ?? []).filter((r: any) => {
        const haystack = `${r.from_location?.name} ${r.to_location?.name}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
    : data;

  return NextResponse.json({ routes: filtered, total: count ?? 0, page, pageSize });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = routeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.from_location_id === parsed.data.to_location_id) {
    return NextResponse.json({ error: "Origin and destination must be different." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("route_prices")
    .insert({ ...parsed.data, created_by: user.id, updated_by: user.id })
    .select(
      "id, price, currency, from_location:from_location_id(name), to_location:to_location_id(name), transport_type:transport_type_id(name)"
    )
    .single();

  if (error) {
    // Unique partial index violation => duplicate active route
    const message =
      error.code === "23505"
        ? "An active route already exists for this origin, destination and transport type."
        : "Failed to create route.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logActivity(
    supabase,
    user.id,
    "route.created",
    "route_price",
    data.id,
    `Added route: ${(data as any).from_location?.name} → ${(data as any).to_location?.name} — ${data.price} ${data.currency}`
  );

  return NextResponse.json({ route: data }, { status: 201 });
}
