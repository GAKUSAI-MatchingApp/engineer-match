import { CheckCircle2, Clock, Flag, Loader2 } from "lucide-react";
import { AdminSummaryCard } from "@/components/admin/shared/AdminSummaryCard";
import { ADMIN_REPORT_SUMMARY_LABELS } from "@/constants/admin-reports";
import type { AdminReportListItem } from "@/lib/admin/reports";

interface AdminReportSummaryCardsProps {
  reports: AdminReportListItem[];
}

export function AdminReportSummaryCards({ reports }: AdminReportSummaryCardsProps) {
  const total = reports.length;
  const pending = reports.filter((r) => r.status === "pending").length;
  const inProgress = reports.filter((r) => r.status === "in_progress").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminSummaryCard label={ADMIN_REPORT_SUMMARY_LABELS.total} value={`${total}件`} icon={Flag} />
      <AdminSummaryCard
        label={ADMIN_REPORT_SUMMARY_LABELS.pending}
        value={`${pending}件`}
        icon={Clock}
        tone="negative"
      />
      <AdminSummaryCard
        label={ADMIN_REPORT_SUMMARY_LABELS.inProgress}
        value={`${inProgress}件`}
        icon={Loader2}
        tone="warning"
      />
      <AdminSummaryCard
        label={ADMIN_REPORT_SUMMARY_LABELS.resolved}
        value={`${resolved}件`}
        icon={CheckCircle2}
        tone="positive"
      />
    </div>
  );
}
