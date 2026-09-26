import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from"); // location id
  const to = request.nextUrl.searchParams.get("to"); // location id

  if (!from || !to) {
    return NextResponse.json(
      { error: "Both 'from' and 'to' location ids are required." },
      { status: 400 }
    );
  }

  if (from === to) {
    return NextResponse.json(
      { error: "Origin and destination must be different." },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { data: options, error } = await supabase.rpc("get_route_price", {
    from_id: from,
    to_id: to,
  });

  if (error) {
    return NextResponse.json({ error: "Price lookup failed." }, { status: 500 });
  }

  // Fire-and-forget anonymous search log (no personal data captured).
  supabase
    .from("search_logs")
    .insert({
      from_location_id: from,
      to_location_id: to,
      found_result: (options?.length ?? 0) > 0,
    })
    .then(() => {});

  return NextResponse.json({
    found: (options?.length ?? 0) > 0,
    options: options ?? [],
  });
}
