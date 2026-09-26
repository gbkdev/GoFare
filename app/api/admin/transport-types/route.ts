import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  icon: z.string().trim().max(60).nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from("transport_types").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: "Failed to load transport types." }, { status: 500 });
  return NextResponse.json({ transportTypes: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("transport_types")
    .insert({ ...parsed.data, slug: slugify(parsed.data.name) })
    .select()
    .single();

  if (error) {
    const message = error.code === "23505" ? "A transport type with this name already exists." : "Failed to create transport type.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logActivity(supabase, user.id, "transport_type.created", "transport_type", data.id, `Added transport type: ${data.name}`);

  return NextResponse.json({ transportType: data }, { status: 201 });
}
