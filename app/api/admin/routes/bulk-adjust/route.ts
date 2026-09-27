import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const bulkAdjustSchema = z.object({
  transport_type_id: z.string().optional().default("all"),
  adjustment_type: z.enum(["flat", "percentage"]),
  value: z.number(),
  rounding: z.enum(["none", "integer", "round_5"]).optional().default("none"),
  reason: z.string().trim().min(1, "A reason for the bulk price adjustment is required.").max(300),
});

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = bulkAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { transport_type_id, adjustment_type, value, rounding, reason } = parsed.data;

  // 1. Fetch matching active routes
  let query = supabase
    .from("route_prices")
    .select("id, price, currency, transport_type_id, from_location:from_location_id(name), to_location:to_location_id(name)")
    .eq("is_active", true);

  if (transport_type_id && transport_type_id !== "all") {
    query = query.eq("transport_type_id", transport_type_id);
  }

  const { data: routes, error: fetchErr } = await query;
  if (fetchErr) {
    return NextResponse.json({ error: "Failed to fetch routes for adjustment." }, { status: 500 });
  }

  if (!routes || routes.length === 0) {
    return NextResponse.json({ message: "No active routes found matching criteria.", updatedCount: 0 });
  }

  // 2. Calculate new prices
  const updates: { id: string; oldPrice: number; newPrice: number; name: string }[] = [];

  for (const route of routes) {
    const oldPrice = Number(route.price);
    let newPrice: number;

    if (adjustment_type === "flat") {
      newPrice = oldPrice + value;
    } else {
      // Percentage
      newPrice = oldPrice + oldPrice * (value / 100);
    }

    // Apply rounding
    if (rounding === "integer") {
      newPrice = Math.round(newPrice);
    } else if (rounding === "round_5") {
      newPrice = Math.round(newPrice / 5) * 5;
    } else {
      // Round to 2 decimal places max
      newPrice = Math.round(newPrice * 100) / 100;
    }

    // Prevent negative prices
    newPrice = Math.max(0, newPrice);

    // Skip if unchanged
    if (newPrice !== oldPrice) {
      const fromName = (route.from_location as any)?.name ?? "Unknown";
      const toName = (route.to_location as any)?.name ?? "Unknown";
      updates.push({
        id: route.id,
        oldPrice,
        newPrice,
        name: `${fromName} → ${toName}`,
      });
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ message: "All routes already at target prices.", updatedCount: 0 });
  }

  // 3. Perform updates in batches
  let updatedCount = 0;
  for (const item of updates) {
    const { error: updateErr } = await supabase
      .from("route_prices")
      .update({ price: item.newPrice, updated_by: user.id })
      .eq("id", item.id);

    if (!updateErr) {
      updatedCount++;
      // Attach the admin reason to the newly triggered price_history row
      await supabase
        .from("price_history")
        .update({ reason })
        .eq("route_price_id", item.id)
        .order("changed_at", { ascending: false })
        .limit(1);
    }
  }

  // 4. Log admin activity
  const adjustmentLabel =
    adjustment_type === "flat"
      ? `${value >= 0 ? "+" : ""}${value} ETB`
      : `${value >= 0 ? "+" : ""}${value}%`;

  await logActivity(
    supabase,
    user.id,
    "route.bulk_price_adjustment",
    "route_price",
    null,
    `Bulk price adjusted ${updatedCount} route(s) by ${adjustmentLabel} (Reason: ${reason})`
  );

  return NextResponse.json({
    success: true,
    updatedCount,
    totalTargeted: routes.length,
    reason,
    samples: updates.slice(0, 5),
  });
}
