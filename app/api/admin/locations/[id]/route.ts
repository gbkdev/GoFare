import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("locations")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to update location." }, { status: 400 });

  await logActivity(supabase, user.id, "location.updated", "location", data.id, `Updated location: ${data.name}`, parsed.data);

  return NextResponse.json({ location: data });
}

/** Deactivate rather than hard-delete, so historical routes/prices stay intact. */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("locations")
    .update({ is_active: false })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to deactivate location." }, { status: 400 });

  await logActivity(supabase, user.id, "location.deactivated", "location", data.id, `Deactivated location: ${data.name}`);

  return NextResponse.json({ location: data });
}
