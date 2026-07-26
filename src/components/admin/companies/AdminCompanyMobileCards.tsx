import Link from "next/link";
import { AdminMobileCardList } from "@/components/admin/shared/AdminMobileCardList";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_COMPANY_ACTION_LABELS,
  ADMIN_COMPANY_STATUS_ACTION_PENDING_NOTE,
  ADMIN_COMPANY_USAGE_STATUS_LABEL,
  ADMIN_COMPANY_USAGE_STATUS_TONE,
} from "@/constants/admin-companies";
import type { AdminCompanyListItem } from "@/lib/admin/companies";

interface AdminCompanyMobileCardsProps {
  companies: AdminCompanyListItem[];
}

export function AdminCompanyMobileCards({ companies }: AdminCompanyMobileCardsProps) {
  return (
    <AdminMobileCardList>
      {companies.map((company) => (
        <div key={company.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{company.name}</p>
              <p className="truncate text-xs text-muted-foreground">{company.contactName ?? "—"}</p>
            </div>
            <AdminStatusBadge
              label={ADMIN_COMPANY_USAGE_STATUS_LABEL[company.usageStatus]}
              tone={ADMIN_COMPANY_USAGE_STATUS_TONE[company.usageStatus]}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{company.industry ?? "—"}</span>
            <span>・</span>
            <span>{company.jobCount}件の求人</span>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">{company.createdAtLabel}</div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
            <Link
              href={`/admin/companies/${company.id}`}
              className="rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_COMPANY_ACTION_LABELS.viewDetails}
            </Link>
            <span
              title={ADMIN_COMPANY_STATUS_ACTION_PENDING_NOTE}
              className="cursor-not-allowed rounded text-xs font-semibold text-muted-foreground"
            >
              {company.usageStatus === "SUSPENDED"
                ? ADMIN_COMPANY_ACTION_LABELS.reinstate
                : ADMIN_COMPANY_ACTION_LABELS.suspend}
            </span>
          </div>
        </div>
      ))}
    </AdminMobileCardList>
  );
}
