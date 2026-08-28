import Link from "next/link";
import {
  Bell,
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Settings,
  ShieldAlert,
  Building2,
  Star,
  Users,
} from "lucide-react";
import { ADMIN_BRAND } from "@/constants/admin";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  layoutDashboard: LayoutDashboard,
  users: Users,
  building2: Building2,
  briefcase: Briefcase,
  clipboardList: ClipboardList,
  listChecks: ListChecks,
  messageSquare: MessageSquare,
  shieldAlert: ShieldAlert,
  star: Star,
  bell: Bell,
  settings: Settings,
} as const;

export interface AdminNavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
}

interface AdminNavLinksProps {
  items: readonly AdminNavItem[];
  activeHref: string;
  onNavigate?: () => void;
}

export function AdminNavLinks({
  items,
  activeHref,
  onNavigate,
}: AdminNavLinksProps) {
  // Notifications now lives as a bell icon in the topbar (AdminTopbar), not
  // as a full nav row here -- filtered by icon so href lookups by icon
  // elsewhere keep working.
  const linkItems = items.filter((item) => item.icon !== "bell");

  return (
    <nav className="flex flex-col gap-1">
      {linkItems.map((item) => {
        const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP];
        const isActive = item.href === activeHref;
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
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface AdminSidebarProps {
  items: readonly AdminNavItem[];
  activeHref: string;
}

export function AdminSidebar({ items, activeHref }: AdminSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
      <div className="flex h-[72px] shrink-0 items-center border-b border-border px-6">
        <Link href="/admin" className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-foreground">
            {ADMIN_BRAND.name}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {ADMIN_BRAND.subtitle}
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AdminNavLinks items={items} activeHref={activeHref} />
      </div>
    </aside>
  );
}
