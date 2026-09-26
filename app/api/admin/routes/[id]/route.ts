import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const updateSchema = z.object({
  price: z.number().min(0).max(1_000_000).optional(),
  currency: z.string().trim().length(3).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
  reason: z.string().trim().max(300).optional(), // optional note for price_history
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: route, error: routeErr } = await supabase
    .from("route_prices")
    .select(
      "*, from_location:from_location_id(id, name), to_location:to_location_id(id, name), transport_type:transport_type_id(id, name, icon)"
    )
    .eq("id", params.id)
    .single();

  if (routeErr) return NextResponse.json({ error: "Route not found." }, { status: 404 });

  const { data: history } = await supabase
    .from("price_history")
    .select("id, old_price, new_price, changed_at, reason")
    .eq("route_price_id", params.id)
    .order("changed_at", { ascending: false });

  return NextResponse.json({ route, history: history ?? [] });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: before } = await supabase
    .from("route_prices")
    .select("price, from_location:from_location_id(name), to_location:to_location_id(name)")
    .eq("id", params.id)
    .single();

  const { reason, ...updateFields } = parsed.data;

  const { data, error } = await supabase
    .from("route_prices")
    .update({ ...updateFields, updated_by: user.id })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to update route." }, { status: 400 });

  // If price changed, attach the admin's reason to the auto-created history row.
  if (reason && before && updateFields.price !== undefined && before.price !== updateFields.price) {
    await supabase
      .from("price_history")
      .update({ reason })
      .eq("route_price_id", params.id)
      .order("changed_at", { ascending: false })
      .limit(1);
  }

  const fromName = (before as any)?.from_location?.name ?? "?";
  const toName = (before as any)?.to_location?.name ?? "?";

  if (updateFields.price !== undefined && before && before.price !== updateFields.price) {
    await logActivity(
      supabase,
      user.id,
      "route.price_changed",
      "route_price",
      data.id,
      `Changed price: ${fromName} → ${toName} — ${before.price} → ${updateFields.price} ${data.currency}`
    );
  } else if (updateFields.is_active !== undefined) {
    await logActivity(
      supabase,
      user.id,
      updateFields.is_active ? "route.activated" : "route.deactivated",
      "route_price",
      data.id,
      `${updateFields.is_active ? "Activated" : "Deactivated"} route: ${fromName} → ${toName}`
    );
  }

  return NextResponse.json({ route: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Soft delete — preserves price_history and search_logs integrity.
  const { data, error } = await supabase
    .from("route_prices")
    .update({ is_active: false, updated_by: user.id })
    .eq("id", params.id)
    .select("id, from_location:from_location_id(name), to_location:to_location_id(name)")
    .single();

  if (error) return NextResponse.json({ error: "Failed to deactivate route." }, { status: 400 });

  await logActivity(
    supabase,
    user.id,
    "route.deactivated",
    "route_price",
    data.id,
    `Deactivated route: ${(data as any).from_location?.name} → ${(data as any).to_location?.name}`
  );

  return NextResponse.json({ success: true });
}
