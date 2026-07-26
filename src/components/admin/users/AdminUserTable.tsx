import Link from "next/link";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_USER_ACTION_LABELS,
  ADMIN_USER_ROLE_LABEL,
  ADMIN_USER_ROLE_STYLES,
  ADMIN_USER_STATUS_LABEL,
  ADMIN_USER_STATUS_TONE,
  ADMIN_USER_TABLE_COLUMNS,
} from "@/constants/admin-users";
import type { AdminUserListItem } from "@/lib/admin/users";
import { cn } from "@/lib/utils";

interface AdminUserTableProps {
  users: AdminUserListItem[];
  onSuspend: (id: string) => void;
  onReinstate: (id: string) => void;
}

export function AdminUserTable({ users, onSuspend, onReinstate }: AdminUserTableProps) {
  return (
    <AdminDataTable columns={[...ADMIN_USER_TABLE_COLUMNS]} caption={ADMIN_USER_TABLE_COLUMNS.join("、")}>
      {users.map((user) => (
        <tr key={user.id} className="align-top">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                aria-hidden="true"
              >
                {user.avatarInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                ADMIN_USER_ROLE_STYLES[user.role],
              )}
            >
              {ADMIN_USER_ROLE_LABEL[user.role]}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-foreground">{user.companyName ?? "—"}</td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {user.createdAtLabel}
          </td>
          <td className="px-4 py-3">
            <AdminStatusBadge
              label={ADMIN_USER_STATUS_LABEL[user.status]}
              tone={ADMIN_USER_STATUS_TONE[user.status]}
            />
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
                    className="rounded text-xs font-semibold text-emerald-600 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {ADMIN_USER_ACTION_LABELS.reinstate}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSuspend(user.id)}
                    className="rounded text-xs font-semibold text-amber-600 hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {ADMIN_USER_ACTION_LABELS.suspend}
                  </button>
                ))}
            </div>
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
