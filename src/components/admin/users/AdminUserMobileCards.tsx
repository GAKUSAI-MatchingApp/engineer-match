import Link from "next/link";
import { AdminMobileCardList } from "@/components/admin/shared/AdminMobileCardList";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_USER_ACTION_LABELS,
  ADMIN_USER_ROLE_LABEL,
  ADMIN_USER_ROLE_STYLES,
  ADMIN_USER_STATUS_LABEL,
  ADMIN_USER_STATUS_TONE,
} from "@/constants/admin-users";
import type { AdminUserListItem } from "@/lib/admin/users";
import { cn } from "@/lib/utils";

interface AdminUserMobileCardsProps {
  users: AdminUserListItem[];
  onSuspend: (id: string) => void;
  onReinstate: (id: string) => void;
}

export function AdminUserMobileCards({ users, onSuspend, onReinstate }: AdminUserMobileCardsProps) {
  return (
    <AdminMobileCardList>
      {users.map((user) => (
        <div key={user.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                aria-hidden="true"
              >
                {user.avatarInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <AdminStatusBadge
              label={ADMIN_USER_STATUS_LABEL[user.status]}
              tone={ADMIN_USER_STATUS_TONE[user.status]}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 font-semibold",
                ADMIN_USER_ROLE_STYLES[user.role],
              )}
            >
              {ADMIN_USER_ROLE_LABEL[user.role]}
            </span>
            {user.companyName && <span>{user.companyName}</span>}
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">登録日</dt>
              <dd className="mt-0.5 font-medium text-foreground">{user.createdAtLabel}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
            <Link
              href={`/admin/users/${user.id}`}
              className="rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_USER_ACTION_LABELS.viewDetails}
            </Link>
            {user.status !== "WITHDRAWN" &&
              (user.status === "SUSPENDED" ? (
                <button
                  type="button"
                  onClick={() => onReinstate(user.id)}
                  className="rounded text-xs font-semibold text-emerald-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ADMIN_USER_ACTION_LABELS.reinstate}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSuspend(user.id)}
                  className="rounded text-xs font-semibold text-amber-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ADMIN_USER_ACTION_LABELS.suspend}
                </button>
              ))}
          </div>
        </div>
      ))}
    </AdminMobileCardList>
  );
}
