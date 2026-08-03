import type { SupabaseClient } from "@supabase/supabase-js";

export interface UnreadBadgeCounts {
  unreadMessages: number;
  unreadNotifications: number;
}

/**
 * Lightweight unread counts for the dashboard sidebar/mobile-nav badges.
 * Two `count: exact, head: true` queries -- no rows are transferred, just
 * counts -- so this is cheap enough to run on every DashboardShell render.
 *
 * Role-agnostic: a chat_rooms row's (engineer_id = userId OR company_user_id
 * = userId) check matches whichever side the caller is on, so the same query
 * works for both Engineer and Company without a role parameter. RLS
 * (messages_select_participant, notifications_select_own -- 026/027
 * migrations) already restricts both queries to the caller's own rows.
 */
export async function getUnreadBadgeCounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<UnreadBadgeCounts> {
  const [messagesResult, notificationsResult] = await Promise.all([
    supabase
      .from("messages")
      .select("id, chat_rooms!inner(engineer_id, company_user_id)", {
        count: "exact",
        head: true,
      })
      .neq("sender_id", userId)
      .is("read_at", null)
      .or(`engineer_id.eq.${userId},company_user_id.eq.${userId}`, {
        foreignTable: "chat_rooms",
      }),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
  ]);

  if (messagesResult.error) {
    console.error("[dashboard-badges] failed to count unread messages:", messagesResult.error);
  }
  if (notificationsResult.error) {
    console.error(
      "[dashboard-badges] failed to count unread notifications:",
      notificationsResult.error,
    );
  }

  return {
    unreadMessages: messagesResult.error ? 0 : (messagesResult.count ?? 0),
    unreadNotifications: notificationsResult.error ? 0 : (notificationsResult.count ?? 0),
  };
}
