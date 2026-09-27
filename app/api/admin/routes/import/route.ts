import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const rowSchema = z.object({
  from_location: z.string().trim().min(1),
  to_location: z.string().trim().min(1),
  transport_type: z.string().trim().min(1).default("Taxi"),
  price: z.number().min(0).max(1_000_000),
  currency: z.string().trim().length(3).default("ETB"),
  notes: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean().default(true),
});

const importPayloadSchema = z.union([
  z.array(rowSchema).min(1).max(2000),
  z.object({
    routes: z.array(rowSchema).min(1).max(2000),
    updateExisting: z.boolean().optional().default(false),
  }),
]);

/**
 * Bulk Import with optional Upsert:
 * - Inserts new routes.
 * - If updateExisting is enabled, updates price on matching existing active routes
 *   and logs change in price_history.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const queryUpdateExisting = url.searchParams.get("updateExisting") === "true";

  const body = await request.json().catch(() => null);
  const parsed = importPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid JSON. Expected an array of routes or { routes: [...], updateExisting: boolean }.",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const rows = Array.isArray(parsed.data) ? parsed.data : parsed.data.routes;
  const updateExisting = Array.isArray(parsed.data) ? queryUpdateExisting : (parsed.data.updateExisting ?? queryUpdateExisting);

  const [{ data: locations }, { data: transportTypes }, { data: existingRoutes }] = await Promise.all([
    supabase.from("locations").select("id, name"),
    supabase.from("transport_types").select("id, name"),
    supabase.from("route_prices").select("id, from_location_id, to_location_id, transport_type_id, price").eq("is_active", true),
  ]);

  const locByName = new Map((locations ?? []).map((l) => [l.name.toLowerCase(), l.id]));
  const typeByName = new Map((transportTypes ?? []).map((t) => [t.name.toLowerCase(), t.id]));
  const existingMap = new Map(
    (existingRoutes ?? []).map((r) => [`${r.from_location_id}::${r.to_location_id}::${r.transport_type_id}`, r])
  );

  const toInsert: any[] = [];
  const toUpdate: { id: string; oldPrice: number; newPrice: number; label: string }[] = [];
  const skipped: { row: string; reason: string }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const label = `${row.from_location} → ${row.to_location} (${row.transport_type})`;
    const fromId = locByName.get(row.from_location.toLowerCase());
    const toId = locByName.get(row.to_location.toLowerCase());
    const typeId = typeByName.get(row.transport_type.toLowerCase());

    if (!fromId) { skipped.push({ row: label, reason: `Unknown location "${row.from_location}"` }); continue; }
    if (!toId) { skipped.push({ row: label, reason: `Unknown location "${row.to_location}"` }); continue; }
    if (!typeId) { skipped.push({ row: label, reason: `Unknown transport type "${row.transport_type}"` }); continue; }
    if (fromId === toId) { skipped.push({ row: label, reason: "Origin and destination are the same" }); continue; }

    const key = `${fromId}::${toId}::${typeId}`;

    if (existingMap.has(key)) {
      if (updateExisting) {
        const existing = existingMap.get(key)!;
        if (Number(existing.price) !== row.price) {
          toUpdate.push({
            id: existing.id,
            oldPrice: Number(existing.price),
            newPrice: row.price,
            label,
          });
        } else {
          skipped.push({ row: label, reason: "Route already exists with the same price" });
        }
      } else {
        skipped.push({ row: label, reason: "An active route already exists for this combination" });
      }
      continue;
    }

    if (seen.has(key)) {
      skipped.push({ row: label, reason: "Duplicate route in uploaded file" });
      continue;
    }
    seen.add(key);

    toInsert.push({
      from_location_id: fromId,
      to_location_id: toId,
      transport_type_id: typeId,
      price: row.price,
      currency: row.currency,
      notes: row.notes ?? null,
      is_active: row.is_active,
      created_by: user.id,
      updated_by: user.id,
    });
  }

  // Execute inserts
  let inserted: any[] = [];
  if (toInsert.length > 0) {
    const { data, error } = await supabase.from("route_prices").insert(toInsert).select();
    if (error) return NextResponse.json({ error: "Import failed while saving new routes." }, { status: 500 });
    inserted = data ?? [];
  }

  // Execute updates if updateExisting is on
  let updatedCount = 0;
  for (const item of toUpdate) {
    const { error: updErr } = await supabase
      .from("route_prices")
      .update({ price: item.newPrice, updated_by: user.id })
      .eq("id", item.id);

    if (!updErr) {
      updatedCount++;
      // Record reason in price_history
      await supabase
        .from("price_history")
        .update({ reason: "Bulk JSON import price update" })
        .eq("route_price_id", item.id)
        .order("changed_at", { ascending: false })
        .limit(1);
    }
  }

  await logActivity(
    supabase,
    user.id,
    "route.imported",
    "route_price",
    null,
    `Imported ${inserted.length} new route(s), updated ${updatedCount} existing price(s) (${skipped.length} skipped)`
  );

  return NextResponse.json({
    imported: inserted.length,
    updated: updatedCount,
    skipped: skipped.length,
    skippedDetails: skipped,
  });
}
