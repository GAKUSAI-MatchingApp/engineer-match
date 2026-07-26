import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_USER_ACTION_LABELS,
  ADMIN_USER_ROLE_LABEL,
  ADMIN_USER_ROLE_STYLES,
  ADMIN_USER_STATUS_LABEL,
  ADMIN_USER_STATUS_TONE,
} from "@/constants/admin-users";
import type { AdminUserDetail } from "@/lib/admin/users";
import { cn } from "@/lib/utils";

interface AdminUserDetailHeaderProps {
  user: AdminUserDetail;
  onSuspend: () => void;
  onReinstate: () => void;
  /** Non-null when suspend must be blocked (self / sole active admin) — disables the button and shows this as the reason. */
  suspendDisabledReason?: string | null;
}

export function AdminUserDetailHeader({
  user,
  onSuspend,
  onReinstate,
  suspendDisabledReason,
}: AdminUserDetailHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary"
            aria-hidden="true"
          >
            {user.avatarInitials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                  ADMIN_USER_ROLE_STYLES[user.role],
                )}
              >
                {ADMIN_USER_ROLE_LABEL[user.role]}
              </span>
              <AdminStatusBadge
                label={ADMIN_USER_STATUS_LABEL[user.status]}
                tone={ADMIN_USER_STATUS_TONE[user.status]}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            {user.companyName && (
              <p className="text-sm text-muted-foreground">{user.companyName}</p>
            )}
          </div>
        </div>

        {user.status !== "WITHDRAWN" && (
          <div className="flex flex-wrap items-center gap-2">
            {user.status === "SUSPENDED" ? (
              <button
                type="button"
                onClick={onReinstate}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-600 transition-colors duration-200 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {ADMIN_USER_ACTION_LABELS.reinstate}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSuspend}
                disabled={Boolean(suspendDisabledReason)}
                title={suspendDisabledReason ?? undefined}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-600 transition-colors duration-200 hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:hover:bg-muted"
              >
                {ADMIN_USER_ACTION_LABELS.suspend}
              </button>
            )}
          </div>
        )}
      </div>
      {suspendDisabledReason && (
        <p className="mt-3 text-xs text-muted-foreground">{suspendDisabledReason}</p>
      )}
    </div>
  );
}
