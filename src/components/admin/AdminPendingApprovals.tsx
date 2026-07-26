import Link from "next/link";
import { Briefcase, Building2, ShieldAlert } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import {
  ADMIN_APPROVAL_TYPE_ICONS,
  ADMIN_APPROVAL_TYPE_STYLES,
  ADMIN_LABELS,
  ADMIN_PENDING_APPROVALS_SECTION,
  type AdminApprovalItem,
} from "@/constants/admin";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  building2: Building2,
  briefcase: Briefcase,
  shieldAlert: ShieldAlert,
} as const;

interface AdminPendingApprovalsProps {
  items: AdminApprovalItem[];
}

export function AdminPendingApprovals({ items }: AdminPendingApprovalsProps) {
  return (
    <SectionCard
      title={ADMIN_PENDING_APPROVALS_SECTION.title}
      description={ADMIN_PENDING_APPROVALS_SECTION.description}
    >
      {items.length === 0 ? (
        <AdminEmptyState
          title="対応待ちの通報はありません。"
          description="未対応・対応中の通報が発生するとここに表示されます。"
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => {
            const Icon =
              ICON_MAP[
                ADMIN_APPROVAL_TYPE_ICONS[item.type] as keyof typeof ICON_MAP
              ];
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        ADMIN_APPROVAL_TYPE_STYLES[item.type],
                      )}
                    >
                      {item.type}
                    </span>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.submittedBy} ・ {item.dateLabel}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                    {item.status}
                  </span>
                  <Link
                    href={item.detailsHref}
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {ADMIN_LABELS.detailsButton}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
