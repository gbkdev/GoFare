import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const schema = z.object({
  status: z.enum(["pending", "reviewed", "added", "rejected"]),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const { data, error } = await supabase
    .from("route_reports")
    .update({ status: parsed.data.status, reviewed_by: user.id })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to update report." }, { status: 400 });

  await logActivity(
    supabase,
    user.id,
    "report.status_changed",
    "route_report",
    data.id,
    `Marked report "${data.from_location} → ${data.to_location}" as ${data.status}`
  );

  return NextResponse.json({ report: data });
}
