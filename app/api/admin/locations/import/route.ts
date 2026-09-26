import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireUser } from "@/lib/admin/activity";

const rowSchema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120).default("Addis Ababa"),
  description: z.string().trim().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  is_active: z.boolean().default(true),
});

const importSchema = z.array(rowSchema).min(1).max(2000);

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Additive import: existing locations are never touched or removed.
 * A row whose (slug, city) already exists is skipped, not overwritten,
 * so re-uploading the same file is always safe.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const user = await requireUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid JSON. Expected an array of locations with at least a 'name' field.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase.from("locations").select("slug, city");
  const existingKeys = new Set((existing ?? []).map((l) => `${l.slug}::${l.city.toLowerCase()}`));

  const seenInFile = new Set<string>();
  const toInsert: any[] = [];
  const skipped: string[] = [];

  for (const row of parsed.data) {
    const slug = slugify(row.name);
    const key = `${slug}::${row.city.toLowerCase()}`;
    if (existingKeys.has(key) || seenInFile.has(key)) {
      skipped.push(row.name);
      continue;
    }
    seenInFile.add(key);
    toInsert.push({ ...row, slug });
  }

  let inserted: any[] = [];
  if (toInsert.length > 0) {
    const { data, error } = await supabase.from("locations").insert(toInsert).select();
    if (error) return NextResponse.json({ error: "Import failed while saving locations." }, { status: 500 });
    inserted = data ?? [];
  }

  await logActivity(
    supabase,
    user.id,
    "location.imported",
    "location",
    null,
    `Imported ${inserted.length} location(s) from JSON (${skipped.length} skipped as duplicates)`
  );

  return NextResponse.json({
    imported: inserted.length,
    skipped: skipped.length,
    skippedNames: skipped,
  });
}
