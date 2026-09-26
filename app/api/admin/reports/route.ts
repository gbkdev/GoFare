import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const status = request.nextUrl.searchParams.get("status"); // pending | reviewed | added | rejected

  let query = supabase.from("route_reports").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to load reports." }, { status: 500 });
  return NextResponse.json({ reports: data });
}
