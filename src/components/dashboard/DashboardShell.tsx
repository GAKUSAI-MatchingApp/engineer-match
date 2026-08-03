import type { ReactNode } from "react";
import {
  DashboardSidebar,
  type DashboardNavBadges,
  type DashboardNavItem,
} from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { getUnreadBadgeCounts } from "@/lib/dashboard/badges";
import { createClient } from "@/lib/supabase/server";

interface DashboardShellProps {
  navItems: readonly DashboardNavItem[];
  activeHref: string;
  pageTitle: string;
  userName: string;
  userInitials: string;
  userEmail?: string;
  children: ReactNode;
}

/**
 * Builds the sidebar/mobile-nav badge map from navItems + unread counts,
 * matched by icon (not href) since the Messages/Notifications hrefs differ
 * between the Engineer nav (/messages, /notifications) and Company nav
 * (/company/messages, /company/notifications) -- the icon key is the one
 * thing both share.
 */
function buildNavBadges(
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

export async function DashboardShell({
  navItems,
  activeHref,
  pageTitle,
  userName,
  userInitials,
  userEmail,
  children,
}: DashboardShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { unreadMessages, unreadNotifications } = user
    ? await getUnreadBadgeCounts(supabase, user.id)
    : { unreadMessages: 0, unreadNotifications: 0 };

  const badges = buildNavBadges(navItems, unreadMessages, unreadNotifications);

  return (
    <div className="flex min-h-svh bg-background">
      <DashboardSidebar items={navItems} activeHref={activeHref} badges={badges} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          items={navItems}
          activeHref={activeHref}
          pageTitle={pageTitle}
          userName={userName}
          userInitials={userInitials}
          userEmail={userEmail}
          badges={badges}
        />

        <main className="flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
