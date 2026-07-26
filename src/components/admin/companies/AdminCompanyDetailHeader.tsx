import { Building2 } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_COMPANY_ACTION_LABELS,
  ADMIN_COMPANY_SIZE_LABEL,
  ADMIN_COMPANY_STATUS_ACTION_PENDING_NOTE,
  ADMIN_COMPANY_USAGE_STATUS_LABEL,
  ADMIN_COMPANY_USAGE_STATUS_TONE,
} from "@/constants/admin-companies";
import type { AdminCompanyDetail } from "@/lib/admin/companies";

interface AdminCompanyDetailHeaderProps {
  company: AdminCompanyDetail;
}

export function AdminCompanyDetailHeader({ company }: AdminCompanyDetailHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10"
            aria-hidden="true"
          >
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{company.name}</h2>
              <AdminStatusBadge
                label={ADMIN_COMPANY_USAGE_STATUS_LABEL[company.usageStatus]}
                tone={ADMIN_COMPANY_USAGE_STATUS_TONE[company.usageStatus]}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {company.industry ?? "業種未設定"}
              {company.companySize && ` ・ ${ADMIN_COMPANY_SIZE_LABEL[company.companySize] ?? company.companySize}`}
            </p>
            {company.contactName && <p className="text-sm text-muted-foreground">{company.contactName}</p>}
          </div>
        </div>

        <span
          title={ADMIN_COMPANY_STATUS_ACTION_PENDING_NOTE}
          className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-muted-foreground"
        >
          {company.usageStatus === "SUSPENDED"
            ? ADMIN_COMPANY_ACTION_LABELS.reinstate
            : ADMIN_COMPANY_ACTION_LABELS.suspend}
        </span>
      </div>
    </div>
  );
}
