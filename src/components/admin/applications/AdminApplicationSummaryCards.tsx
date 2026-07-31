import { memo } from "react";
import { Award, CalendarClock, CheckCircle2, ClipboardList, Send, XCircle } from "lucide-react";
import { AdminSummaryCard } from "@/components/admin/shared/AdminSummaryCard";
import { ADMIN_APPLICATION_SUMMARY_LABELS } from "@/constants/admin-applications";
import type { AdminApplicationListItem } from "@/lib/admin/applications";

interface AdminApplicationSummaryCardsProps {
  applications: AdminApplicationListItem[];
}

export const AdminApplicationSummaryCards = memo(function AdminApplicationSummaryCards({
  applications,
}: AdminApplicationSummaryCardsProps) {
  const total = applications.length;
  const screening = applications.filter((a) => a.status === "applied" || a.status === "screening").length;
  const interview = applications.filter((a) => a.status === "interview").length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const rejected = applications.filter((a) => a.status === "rejected" || a.status === "withdrawn").length;
  const completed = applications.filter((a) => a.status === "completed").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <AdminSummaryCard label={ADMIN_APPLICATION_SUMMARY_LABELS.total} value={`${total}件`} icon={Send} />
      <AdminSummaryCard
        label={ADMIN_APPLICATION_SUMMARY_LABELS.screening}
        value={`${screening}件`}
        icon={ClipboardList}
      />
      <AdminSummaryCard
        label={ADMIN_APPLICATION_SUMMARY_LABELS.interview}
        value={`${interview}件`}
        icon={CalendarClock}
        tone="warning"
      />
      <AdminSummaryCard
        label={ADMIN_APPLICATION_SUMMARY_LABELS.accepted}
        value={`${accepted}件`}
        icon={Award}
        tone="positive"
      />
      <AdminSummaryCard
        label={ADMIN_APPLICATION_SUMMARY_LABELS.rejected}
        value={`${rejected}件`}
        icon={XCircle}
        tone="negative"
      />
      <AdminSummaryCard
        label={ADMIN_APPLICATION_SUMMARY_LABELS.completed}
        value={`${completed}件`}
        icon={CheckCircle2}
        tone="positive"
      />
    </div>
  );
});
