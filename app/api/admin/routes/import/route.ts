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

const importSchema = z.array(rowSchema).min(1).max(2000);

/**
 * Additive import: matches from_location / to_location / transport_type by
 * name against what already exists. Nothing existing is edited or removed.
 * A row is skipped (with a reason) if its location or transport type name
 * isn't found, or if an active route already exists for that combination.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid JSON. Expected an array of routes with from_location, to_location, transport_type and price.",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const [{ data: locations }, { data: transportTypes }, { data: existingRoutes }] = await Promise.all([
    supabase.from("locations").select("id, name"),
    supabase.from("transport_types").select("id, name"),
    supabase.from("route_prices").select("from_location_id, to_location_id, transport_type_id").eq("is_active", true),
  ]);

  const locByName = new Map((locations ?? []).map((l) => [l.name.toLowerCase(), l.id]));
  const typeByName = new Map((transportTypes ?? []).map((t) => [t.name.toLowerCase(), t.id]));
  const existingKeys = new Set(
    (existingRoutes ?? []).map((r) => `${r.from_location_id}::${r.to_location_id}::${r.transport_type_id}`)
  );

  const toInsert: any[] = [];
  const skipped: { row: string; reason: string }[] = [];
  const seen = new Set<string>();

  for (const row of parsed.data) {
    const label = `${row.from_location} → ${row.to_location} (${row.transport_type})`;
    const fromId = locByName.get(row.from_location.toLowerCase());
    const toId = locByName.get(row.to_location.toLowerCase());
    const typeId = typeByName.get(row.transport_type.toLowerCase());

    if (!fromId) { skipped.push({ row: label, reason: `Unknown location "${row.from_location}"` }); continue; }
    if (!toId) { skipped.push({ row: label, reason: `Unknown location "${row.to_location}"` }); continue; }
    if (!typeId) { skipped.push({ row: label, reason: `Unknown transport type "${row.transport_type}"` }); continue; }
    if (fromId === toId) { skipped.push({ row: label, reason: "Origin and destination are the same" }); continue; }

    const key = `${fromId}::${toId}::${typeId}`;
    if (existingKeys.has(key) || seen.has(key)) {
      skipped.push({ row: label, reason: "An active route already exists for this combination" });
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

  let inserted: any[] = [];
  if (toInsert.length > 0) {
    const { data, error } = await supabase.from("route_prices").insert(toInsert).select();
    if (error) return NextResponse.json({ error: "Import failed while saving routes." }, { status: 500 });
    inserted = data ?? [];
  }

  await logActivity(
    supabase,
    user.id,
    "route.imported",
    "route_price",
    null,
    `Imported ${inserted.length} route(s) from JSON (${skipped.length} skipped)`
  );

  return NextResponse.json({
    imported: inserted.length,
    skipped: skipped.length,
    skippedDetails: skipped,
  });
}
