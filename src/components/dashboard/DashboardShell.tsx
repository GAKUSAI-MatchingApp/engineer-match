import type { ReactNode } from "react";
import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { UnreadCountsProvider } from "@/components/dashboard/UnreadCountsProvider";
import { ENGINEER_NAV, COMPANY_NAV } from "@/constants/dashboard";
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

  // Matched by content (not reference) against ENGINEER_NAV / COMPANY_NAV's
  // own dashboard entries, same as DashboardTopbar's hasWorkingLogout /
  // profileHref -- keeps the sidebar brand link's target derived from the
  // nav actually passed in rather than a hardcoded role check.
  const homeHref =
    navItems.find(
      (item) =>
        item.href === ENGINEER_NAV[0].href || item.href === COMPANY_NAV[0].href,
    )?.href ?? "/";

  return (
    <UnreadCountsProvider
      initialUnreadMessages={unreadMessages}
      initialUnreadNotifications={unreadNotifications}
      userId={user?.id ?? null}
    >
      <div className="flex min-h-svh bg-background">
        <DashboardSidebar items={navItems} activeHref={activeHref} homeHref={homeHref} />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar
            items={navItems}
            activeHref={activeHref}
            pageTitle={pageTitle}
            userName={userName}
            userInitials={userInitials}
            userEmail={userEmail}
          />

          <main className="flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </UnreadCountsProvider>
  );
}