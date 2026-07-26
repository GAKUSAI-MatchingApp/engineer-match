import Link from "next/link";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_COMPANY_ACTION_LABELS,
  ADMIN_COMPANY_STATUS_ACTION_PENDING_NOTE,
  ADMIN_COMPANY_TABLE_COLUMNS,
  ADMIN_COMPANY_USAGE_STATUS_LABEL,
  ADMIN_COMPANY_USAGE_STATUS_TONE,
} from "@/constants/admin-companies";
import type { AdminCompanyListItem } from "@/lib/admin/companies";

interface AdminCompanyTableProps {
  companies: AdminCompanyListItem[];
}

export function AdminCompanyTable({ companies }: AdminCompanyTableProps) {
  return (
    <AdminDataTable
      columns={[...ADMIN_COMPANY_TABLE_COLUMNS]}
      caption={ADMIN_COMPANY_TABLE_COLUMNS.join("、")}
    >
      {companies.map((company) => (
        <tr key={company.id} className="align-top">
          <td className="px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{company.name}</p>
            </div>
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-foreground">{company.industry ?? "—"}</td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-foreground">{company.contactName ?? "—"}</td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-foreground">{company.jobCount}件</td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {company.createdAtLabel}
          </td>
          <td className="px-4 py-3">
            <AdminStatusBadge
              label={ADMIN_COMPANY_USAGE_STATUS_LABEL[company.usageStatus]}
              tone={ADMIN_COMPANY_USAGE_STATUS_TONE[company.usageStatus]}
            />
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
