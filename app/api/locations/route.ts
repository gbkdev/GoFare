import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("locations")
    .select("id, name, slug, city, latitude, longitude")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load locations." }, { status: 500 });
  }

  return NextResponse.json({ locations: data });
}
