import { UserCog } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { ADMIN_RECENT_ACTIVITY_SECTION } from "@/constants/admin";
import type { AdminActivityLogItem } from "@/lib/admin/dashboard";

interface AdminRecentActivityProps {
  items: AdminActivityLogItem[];
}

/**
 * Sourced from admin_audit_logs, written via the admin_write_audit_log()
 * SECURITY DEFINER function (051_admin_audit_log_function.sql) -- renders
 * empty until the first admin action writes a row.
 */
export function AdminRecentActivity({ items }: AdminRecentActivityProps) {
  return (
    <SectionCard
      title={ADMIN_RECENT_ACTIVITY_SECTION.title}
      description={ADMIN_RECENT_ACTIVITY_SECTION.description}
    >
      {items.length === 0 ? (
        <AdminEmptyState
          title="操作履歴はありません。"
          description="管理者による操作が行われると、ここに履歴が表示されます。"
        />
      ) : (
        <ul className="flex max-h-[32rem] flex-col divide-y divide-border overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <UserCog className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.dateLabel}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                )}
                <p className="mt-1 text-xs font-medium text-foreground">{item.actor}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
