import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardNavBadges,
  DashboardNavItem,
} from "@/components/dashboard/DashboardSidebar";

export interface UnreadBadgeCounts {
  unreadMessages: number;
  unreadNotifications: number;
}

/**
 * Builds the sidebar/mobile-nav badge map from navItems + unread counts,
 * matched by icon (not href) since the Messages/Notifications hrefs differ
 * between the Engineer nav (/messages, /notifications) and Company nav
 * (/company/messages, /company/notifications) -- the icon key is the one
 * thing both share. Runs both server-side (DashboardShell's initial provider
 * seed) and client-side (DashboardSidebar/DashboardTopbar, reactively off
 * UnreadCountsProvider's context after an optimistic update).
 */
export function buildNavBadges(
  navItems: readonly DashboardNavItem[],
  unreadMessages: number,
  unreadNotifications: number,
): DashboardNavBadges {
  const badges: DashboardNavBadges = {};

  const messagesHref = navItems.find((item) => item.icon === "messageSquare")?.href;
  if (messagesHref) {
    badges[messagesHref] = {
      count: unreadMessages,
      ariaLabel: `未読メッセージ${unreadMessages}件`,
    };
  }

  const notificationsHref = navItems.find((item) => item.icon === "bell")?.href;
  if (notificationsHref) {
    badges[notificationsHref] = {
      count: unreadNotifications,
      ariaLabel: `未読通知${unreadNotifications}件`,
    };
  }

  return badges;
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
      .select("id, chat_rooms!inner(engineer_id, company_user_id, application_id)", {
        count: "exact",
        head: true,
      })
      .neq("sender_id", userId)
      .is("read_at", null)
      .or(`engineer_id.eq.${userId},company_user_id.eq.${userId}`, {
        foreignTable: "chat_rooms",
      })
      // Review #24 (082_scouts.sql): this badge is what the "メッセージ" nav
      // item shows, and that page (/messages, /company/messages) excludes
      // scout-originated rooms (application_id IS NULL) -- see
      // listMyConversations/listCompanyConversations. Excluding them here
      // too keeps the badge count consistent with what the linked page
      // actually shows; unread scout messages surface via the スカウト nav
      // item instead once that gets its own badge.
      .not("chat_rooms.application_id", "is", null),
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
