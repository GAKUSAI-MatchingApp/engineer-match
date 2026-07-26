import { Flag, History } from "lucide-react";
import { AdminDetailSection } from "@/components/admin/shared/AdminDetailSection";
import { ADMIN_OPPORTUNITY_DETAIL_SECTIONS } from "@/constants/admin-opportunities";
import type { AdminOpportunityDetail } from "@/lib/admin/opportunities";

interface AdminOpportunityHistorySectionProps {
  opportunity: AdminOpportunityDetail;
}

export function AdminOpportunityHistorySection({ opportunity }: AdminOpportunityHistorySectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <AdminDetailSection title={ADMIN_OPPORTUNITY_DETAIL_SECTIONS.applications}>
        <p className="text-sm text-foreground">
          現在の応募数：<span className="font-semibold">{opportunity.applicantCount}名</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          応募者の詳細は応募管理からご確認いただけます。
        </p>
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_OPPORTUNITY_DETAIL_SECTIONS.publicationHistory}>
        {opportunity.publicationHistory.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {opportunity.publicationHistory.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3">
                <History className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {entry.actionType} ・ {entry.actor}
                  </p>
                  {entry.reason && (
                    <p className="mt-0.5 text-xs text-muted-foreground">理由：{entry.reason}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">{entry.dateLabel}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">公開操作履歴はありません。</p>
        )}
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_OPPORTUNITY_DETAIL_SECTIONS.reportHistory}>
        {opportunity.reportHistory.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {opportunity.reportHistory.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3">
                <Flag className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{entry.reasonSummary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {entry.reporterName} ・ {entry.statusLabel} ・ {entry.dateLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">通報履歴はありません。</p>
        )}
      </AdminDetailSection>
    </div>
  );
}
