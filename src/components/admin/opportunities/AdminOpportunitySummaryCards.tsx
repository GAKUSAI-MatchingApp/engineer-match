import { Archive, Briefcase, FileEdit, Send } from "lucide-react";
import { AdminSummaryCard } from "@/components/admin/shared/AdminSummaryCard";
import { ADMIN_OPPORTUNITY_SUMMARY_LABELS } from "@/constants/admin-opportunities";
import type { AdminOpportunityListItem } from "@/lib/admin/opportunities";

interface AdminOpportunitySummaryCardsProps {
  opportunities: AdminOpportunityListItem[];
}

export function AdminOpportunitySummaryCards({ opportunities }: AdminOpportunitySummaryCardsProps) {
  const total = opportunities.length;
  const published = opportunities.filter((o) => o.status === "published").length;
  const draft = opportunities.filter((o) => o.status === "draft").length;
  const closed = opportunities.filter((o) => o.status === "closed").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminSummaryCard label={ADMIN_OPPORTUNITY_SUMMARY_LABELS.total} value={`${total}件`} icon={Briefcase} />
      <AdminSummaryCard
        label={ADMIN_OPPORTUNITY_SUMMARY_LABELS.published}
        value={`${published}件`}
        icon={Send}
        tone="positive"
      />
      <AdminSummaryCard label={ADMIN_OPPORTUNITY_SUMMARY_LABELS.draft} value={`${draft}件`} icon={FileEdit} />
      <AdminSummaryCard
        label={ADMIN_OPPORTUNITY_SUMMARY_LABELS.closed}
        value={`${closed}件`}
        icon={Archive}
        tone="negative"
      />
    </div>
  );
}
