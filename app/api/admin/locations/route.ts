import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const locationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120).default("Addis Ababa"),
  description: z.string().trim().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  is_active: z.boolean().default(true),
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// middleware already blocks unauthenticated/inactive users for /api/admin/*
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const search = request.nextUrl.searchParams.get("q");
  const status = request.nextUrl.searchParams.get("status"); // active | inactive | all

  let query = supabase.from("locations").select("*").order("name");
  if (search) query = query.ilike("name", `%${search}%`);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load locations." }, { status: 500 });
  return NextResponse.json({ locations: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = slugify(parsed.data.name);

  const { data, error } = await supabase
    .from("locations")
    .insert({ ...parsed.data, slug })
    .select()
    .single();

  if (error) {
    const message = error.code === "23505" ? "A location with this name already exists in this city." : "Failed to create location.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logActivity(supabase, user.id, "location.created", "location", data.id, `Added location: ${data.name}`);

  return NextResponse.json({ location: data }, { status: 201 });
}
