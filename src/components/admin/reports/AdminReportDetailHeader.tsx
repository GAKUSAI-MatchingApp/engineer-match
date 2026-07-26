import { Flag } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_REPORT_STATUS_LABEL,
  ADMIN_REPORT_STATUS_TONE,
  ADMIN_REPORT_TARGET_TYPE_LABEL,
} from "@/constants/admin-reports";
import type { AdminReportDetail } from "@/lib/admin/reports";

interface AdminReportDetailHeaderProps {
  report: AdminReportDetail;
}

export function AdminReportDetailHeader({ report }: AdminReportDetailHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-50"
            aria-hidden="true"
          >
            <Flag className="h-6 w-6 text-red-600" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{report.id.slice(0, 8)}</h2>
              <AdminStatusBadge
                label={ADMIN_REPORT_STATUS_LABEL[report.status]}
                tone={ADMIN_REPORT_STATUS_TONE[report.status]}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {ADMIN_REPORT_TARGET_TYPE_LABEL[report.targetType]}
            </p>
            <p className="text-sm text-muted-foreground">対象：{report.targetLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
