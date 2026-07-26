import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminAuditLogParams {
  actionType: string;
  targetType: string;
  targetId: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  reason?: string | null;
}

/**
 * Writes to admin_audit_logs via the admin_write_audit_log() SECURITY
 * DEFINER function (051_admin_audit_log_function.sql) -- the table itself
 * has SELECT-only RLS, no INSERT policy, by design. The function re-checks
 * the caller is ADMIN server-side; a client role claim is never trusted.
 *
 * The underlying data mutation always happens first and independently of
 * this call -- if the audit write fails (e.g. migration 051 not yet
 * applied), the already-committed mutation is not rolled back. Failure is
 * logged but not surfaced as a mutation error, since there is no
 * distributed transaction available over PostgREST to make this atomic.
 */
export async function writeAdminAuditLog(
  supabase: SupabaseClient,
  params: AdminAuditLogParams,
): Promise<void> {
  const { error } = await supabase.rpc("admin_write_audit_log", {
    p_action_type: params.actionType,
    p_target_type: params.targetType,
    p_target_id: params.targetId,
    p_before_data: params.beforeData ?? null,
    p_after_data: params.afterData ?? null,
    p_reason: params.reason ?? null,
  });

  if (error) {
    console.error("[admin] failed to write audit log:", error);
  }
}
