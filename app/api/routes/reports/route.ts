import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reportSchema = z.object({
  from_location: z.string().trim().min(1).max(120),
  to_location: z.string().trim().min(1).max(120),
  suggested_price: z.number().positive().max(1_000_000).nullable().optional(),
  message: z.string().trim().max(500).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fill in the from and to locations." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { error } = await supabase.from("route_reports").insert({
    from_location: parsed.data.from_location,
    to_location: parsed.data.to_location,
    suggested_price: parsed.data.suggested_price ?? null,
    message: parsed.data.message ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Could not submit report." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
