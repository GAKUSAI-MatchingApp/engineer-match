import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * public.line_notification_links shape, per 077_line_notification_links.sql.
 * Hand-written (no Supabase codegen has been run for this project), mirrors
 * src/lib/engineer/profile.ts's EngineerProfile pattern.
 */
export interface LineLink {
  displayName: string | null;
  pictureUrl: string | null;
  isEnabled: boolean;
  isActive: boolean;
  linkedAt: string;
}

/** Settings-page display state derived from a LineLink row (or its absence). */
export type LineLinkStatus = "unlinked" | "active" | "needs_friend";

export function getLineLinkStatus(link: LineLink | null): LineLinkStatus {
  if (!link) return "unlinked";
  if (!link.isActive) return "needs_friend";
  return "active";
}

/**
 * The caller's own LINE link, if any (line_notification_links_select_own
 * RLS). unlinked_at IS NULL filters out a soft-unlinked row -- unlink_line_account()
 * (077) never deletes the row, so without this filter a previously-unlinked
 * user would incorrectly still show as linked.
 */
export async function getEngineerLineLink(
  supabase: SupabaseClient,
  userId: string,
): Promise<LineLink | null> {
  const { data, error } = await supabase
    .from("line_notification_links")
    .select("display_name, picture_url, is_enabled, is_active, linked_at")
    .eq("user_id", userId)
    .is("unlinked_at", null)
    .maybeSingle();

  if (error) {
    console.error("[engineer-line-link] failed to load line link:", error);
    return null;
  }
  if (!data) return null;

  return {
    displayName: data.display_name as string | null,
    pictureUrl: data.picture_url as string | null,
    isEnabled: data.is_enabled as boolean,
    isActive: data.is_active as boolean,
    linkedAt: data.linked_at as string,
  };
}

/** Calls set_line_notifications_enabled(p_enabled) (077) -- the Settings page's single V1 toggle. */
export async function setLineNotificationsEnabled(supabase: SupabaseClient, enabled: boolean) {
  return supabase.rpc("set_line_notifications_enabled", { p_enabled: enabled });
}

/** Calls unlink_line_account() (077) -- soft-unlink, row is kept for history. */
export async function unlinkLineAccount(supabase: SupabaseClient) {
  return supabase.rpc("unlink_line_account");
}
