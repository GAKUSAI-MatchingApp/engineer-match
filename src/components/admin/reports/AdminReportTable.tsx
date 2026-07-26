import Link from "next/link";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_REPORT_ACTION_LABELS,
  ADMIN_REPORT_STATUS_LABEL,
  ADMIN_REPORT_STATUS_TONE,
  ADMIN_REPORT_TABLE_COLUMNS,
} from "@/constants/admin-reports";
import type { AdminReportListItem } from "@/lib/admin/reports";

interface AdminReportTableProps {
  reports: AdminReportListItem[];
}

export function AdminReportTable({ reports }: AdminReportTableProps) {
  const columns = [...ADMIN_REPORT_TABLE_COLUMNS, "操作"];
  return (
    <AdminDataTable columns={columns} caption={columns.join("、")}>
      {reports.map((report) => (
        <tr key={report.id} className="align-top">
          <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-foreground">
            {report.id.slice(0, 8)}
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-foreground">{report.reporterName}</td>
          <td className="px-4 py-3">
            <span className="line-clamp-2 max-w-xs text-sm text-foreground">{report.targetLabel}</span>
          </td>
          <td className="px-4 py-3">
            <AdminStatusBadge
              label={ADMIN_REPORT_STATUS_LABEL[report.status]}
              tone={ADMIN_REPORT_STATUS_TONE[report.status]}
            />
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {report.createdAtLabel}
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {report.assigneeName ?? "未割当"}
          </td>
          <td className="px-4 py-3">
            <Link
              href={`/admin/reports/${report.id}`}
              className="rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_REPORT_ACTION_LABELS.viewDetails}
            </Link>
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
