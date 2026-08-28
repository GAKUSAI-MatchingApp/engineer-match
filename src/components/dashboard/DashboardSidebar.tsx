"use client";

import Link from "next/link";
import {
  Bell,
  Briefcase,
  Building2,
  ClipboardList,
  FilePlus2,
  Heart,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Search,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { BRAND } from "@/constants/lp";
import { cn } from "@/lib/utils";
import { UnreadBadge } from "@/components/dashboard/UnreadBadge";
import { useUnreadCounts } from "@/components/dashboard/UnreadCountsProvider";
import { buildNavBadges } from "@/lib/dashboard/badges";

/** Keyed by nav item href. Only entries for the Messages/Notifications items are ever set. */
export type DashboardNavBadges = Record<string, { count: number; ariaLabel: string }>;

export interface DashboardNavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
}

const ICON_MAP = {
  layoutDashboard: LayoutDashboard,
  userRound: UserRound,
  search: Search,
  clipboardList: ClipboardList,
  mail: Mail,
  messageSquare: MessageSquare,
  bell: Bell,
  heart: Heart,
  settings: Settings,
  building2: Building2,
  briefcase: Briefcase,
  filePlus2: FilePlus2,
  users: Users,
} as const;

interface DashboardNavLinksProps {
  items: readonly DashboardNavItem[];
  activeHref: string;
  onNavigate?: () => void;
  badges?: DashboardNavBadges;
}

export function DashboardNavLinks({
  items,
  activeHref,
  onNavigate,
  badges,
}: DashboardNavLinksProps) {
  // Notifications now lives as a bell icon in the topbar (DashboardTopbar),
  // not as a full nav row here -- filtered by icon (not removed from
  // ENGINEER_NAV/COMPANY_NAV) so href/badge lookups by icon keep working.
  const linkItems = items.filter((item) => item.icon !== "bell");

  return (
    <nav className="flex flex-col gap-1">
      {linkItems.map((item) => {
        const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP];
        const isActive = item.href === activeHref;
        const badge = badges?.[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="relative inline-flex shrink-0">
              <Icon className="h-5 w-5" aria-hidden="true" />
              {badge && <UnreadBadge count={badge.count} ariaLabel={badge.ariaLabel} />}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface DashboardSidebarProps {
  items: readonly DashboardNavItem[];
  activeHref: string;
  homeHref: string;
}

export function DashboardSidebar({ items, activeHref, homeHref }: DashboardSidebarProps) {
  const { unreadMessages, unreadNotifications } = useUnreadCounts();
  const badges = buildNavBadges(items, unreadMessages, unreadNotifications);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
      <div className="flex h-[72px] shrink-0 items-center border-b border-border px-6">
        <Link href={homeHref} className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-foreground">
            {BRAND.name}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {BRAND.subtitle}
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <DashboardNavLinks items={items} activeHref={activeHref} badges={badges} />
      </div>
    </aside>
  );
}
