"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import { AdminNavLinks, type AdminNavItem } from "@/components/admin/AdminSidebar";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { ADMIN_BRAND, ADMIN_LABELS } from "@/constants/admin";
import { cn } from "@/lib/utils";

interface AdminTopbarProps {
  items: readonly AdminNavItem[];
  activeHref: string;
  pageTitle: string;
  userName: string;
  userInitials: string;
}

export function AdminTopbar({
  items,
  activeHref,
  pageTitle,
  userName,
  userInitials,
}: AdminTopbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  // Bell icon in the header replaces the old "通知" sidebar row. No unread
  // count is wired up for admin notifications yet (unlike the
  // engineer/company DashboardTopbar), so this is a plain link for now.
  const notificationsHref = items.find((item) => item.icon === "bell")?.href;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label={ADMIN_LABELS.openMenu}
            aria-expanded={isMenuOpen}
            className="inline-flex items-center justify-center rounded-xl p-2 text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="text-base font-semibold text-foreground sm:text-lg">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {notificationsHref && (
            <Link
              href={notificationsHref}
              aria-label="通知"
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}
          <UserMenu userName={userName} userInitials={userInitials} />
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
          aria-label={ADMIN_LABELS.closeMenu}
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
          aria-label={ADMIN_LABELS.navigationMenu}
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl transition-transform duration-200",
            isMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-4">
            <Link
              href="/admin"
              onClick={closeMenu}
              className="flex flex-col leading-tight"
            >
              <span className="text-base font-bold tracking-tight text-foreground">
                {ADMIN_BRAND.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {ADMIN_BRAND.subtitle}
              </span>
            </Link>
            <button
              type="button"
              onClick={closeMenu}
              aria-label={ADMIN_LABELS.closeMenu}
              className="inline-flex items-center justify-center rounded-xl p-2 text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <AdminNavLinks
              items={items}
              activeHref={activeHref}
              onNavigate={closeMenu}
            />
          </div>
        </div>
      </div>
    </>
  );
}
