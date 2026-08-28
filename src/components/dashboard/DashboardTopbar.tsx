"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import {
  DashboardNavLinks,
  type DashboardNavItem,
} from "@/components/dashboard/DashboardSidebar";
import { UnreadBadge } from "@/components/dashboard/UnreadBadge";
import { useUnreadCounts } from "@/components/dashboard/UnreadCountsProvider";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { BRAND } from "@/constants/lp";
import { COMPANY_NAV, ENGINEER_NAV } from "@/constants/dashboard";
import { buildNavBadges } from "@/lib/dashboard/badges";
import { cn } from "@/lib/utils";

interface DashboardTopbarProps {
  items: readonly DashboardNavItem[];
  activeHref: string;
  pageTitle: string;
  userName: string;
  userInitials: string;
  userEmail?: string;
}

export function DashboardTopbar({
  items,
  activeHref,
  pageTitle,
  userName,
  userInitials,
}: DashboardTopbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { unreadMessages, unreadNotifications } = useUnreadCounts();
  const badges = buildNavBadges(items, unreadMessages, unreadNotifications);
  const closeMenu = () => setIsMenuOpen(false);

  // This shared topbar is only ever rendered with the engineer or company
  // nav (admin has its own AdminTopbar, which renders the same UserMenu
  // directly). Matched by content (not reference) since HMR/bundling can
  // give ENGINEER_NAV / COMPANY_NAV multiple module instances in dev.
  const hasWorkingLogout = items.some(
    (item) =>
      item.href === ENGINEER_NAV[0].href || item.href === COMPANY_NAV[0].href,
  );

  // Same nav (not the sidebar's own "プロフィール" entry) drives the
  // UserMenu's "マイページ" link, so both stay pointed at the same page.
  const profileHref = items.find(
    (item) =>
      item.href === ENGINEER_NAV[1].href || item.href === COMPANY_NAV[1].href,
  )?.href;

  // Bell icon in the header replaces the old "通知" sidebar row --
  // same href/badge lookup pattern as profileHref above.
  const notificationsHref = items.find((item) => item.icon === "bell")?.href;
  const notificationsCount = notificationsHref
    ? (badges?.[notificationsHref]?.count ?? 0)
    : 0;

  // Combined count so the collapsed hamburger icon itself shows that
  // something's unread, not just the nav links once the drawer is open.
  const menuBadgeCount = Object.values(badges ?? {}).reduce(
    (total, badge) => total + badge.count,
    0,
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label={
              menuBadgeCount > 0
                ? `メニューを開く（未読${menuBadgeCount}件）`
                : "メニューを開く"
            }
            aria-expanded={isMenuOpen}
            className="relative inline-flex items-center justify-center rounded-xl p-2 text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <UnreadBadge count={menuBadgeCount} />
          </button>
          <h1 className="text-base font-semibold text-foreground sm:text-lg">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {notificationsHref && (
            <Link
              href={notificationsHref}
              aria-label={
                notificationsCount > 0
                  ? `通知（未読${notificationsCount}件）`
                  : "通知"
              }
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              <UnreadBadge count={notificationsCount} />
            </Link>
          )}
          {hasWorkingLogout ? (
            <UserMenu userName={userName} userInitials={userInitials} profileHref={profileHref} />
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-border py-1.5 pr-3 pl-1.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {userInitials}
              </div>
              <span className="hidden text-sm font-medium text-foreground sm:inline">
                {userName}
              </span>
            </div>
          )}
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="メニューを閉じる"
          tabIndex={isMenuOpen ? 0 : -1}
          onClick={closeMenu}
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-200",
            isMenuOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-hidden={!isMenuOpen}
          aria-label="ナビゲーションメニュー"
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl transition-transform duration-200",
            isMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-4">
            <Link
              href="/"
              onClick={closeMenu}
              className="flex flex-col leading-tight"
            >
              <span className="text-base font-bold tracking-tight text-foreground">
                {BRAND.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {BRAND.subtitle}
              </span>
            </Link>
            <button
              type="button"
              onClick={closeMenu}
              aria-label="メニューを閉じる"
              className="inline-flex items-center justify-center rounded-xl p-2 text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <DashboardNavLinks
              items={items}
              activeHref={activeHref}
              onNavigate={closeMenu}
              badges={badges}
            />
          </div>
        </div>
      </div>
    </>
  );
}
