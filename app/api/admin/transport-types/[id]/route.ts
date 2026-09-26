import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  icon: z.string().trim().max(60).nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updateFields: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.name) updateFields.slug = slugify(parsed.data.name);

  const { data, error } = await supabase
    .from("transport_types")
    .update(updateFields)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    const message = error.code === "23505" ? "A transport type with this name already exists." : "Failed to update transport type.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logActivity(supabase, user.id, "transport_type.updated", "transport_type", data.id, `Updated transport type: ${data.name}`, parsed.data);

  return NextResponse.json({ transportType: data });
}

/** Deactivate rather than hard-delete — existing route_prices reference this type. */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("transport_types")
    .update({ is_active: false })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to deactivate transport type." }, { status: 400 });

  await logActivity(supabase, user.id, "transport_type.deactivated", "transport_type", data.id, `Deactivated transport type: ${data.name}`);

  return NextResponse.json({ transportType: data });
}
