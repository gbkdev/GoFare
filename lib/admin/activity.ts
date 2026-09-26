import type { SupabaseClient } from "@supabase/supabase-js";

/** Records an admin action for the audit trail. Never throws — logging must not block the request. */
export async function logActivity(
  supabase: SupabaseClient,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await supabase.from("admin_activity_logs").insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      metadata,
    });
  } catch {
    // Swallow logging failures; the primary action already succeeded.
  }
}

export async function requireUser(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
