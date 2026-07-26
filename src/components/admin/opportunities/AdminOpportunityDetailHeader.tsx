import { Briefcase } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_OPPORTUNITY_ACTION_LABELS,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL,
  ADMIN_OPPORTUNITY_STATUS_LABEL,
  ADMIN_OPPORTUNITY_STATUS_TONE,
} from "@/constants/admin-opportunities";
import type { AdminOpportunityDetail, AdminOpportunityModerationAction } from "@/lib/admin/opportunities";

interface AdminOpportunityDetailHeaderProps {
  opportunity: AdminOpportunityDetail;
  onAction: (action: AdminOpportunityModerationAction) => void;
}

export function AdminOpportunityDetailHeader({ opportunity, onAction }: AdminOpportunityDetailHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10"
            aria-hidden="true"
          >
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{opportunity.title}</h2>
              <AdminStatusBadge
                label={
                  opportunity.unpublishedByAdmin
                    ? "管理者非公開"
                    : ADMIN_OPPORTUNITY_STATUS_LABEL[opportunity.status]
                }
                tone={
                  opportunity.unpublishedByAdmin
                    ? "negative"
                    : ADMIN_OPPORTUNITY_STATUS_TONE[opportunity.status]
                }
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {opportunity.companyName} ・ {ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[opportunity.contractType]}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {opportunity.unpublishedByAdmin ? (
            <button
              type="button"
              onClick={() => onAction("republish")}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-600 transition-colors duration-200 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_OPPORTUNITY_ACTION_LABELS.republish}
            </button>
          ) : (
            opportunity.status === "published" && (
              <button
                type="button"
                onClick={() => onAction("takedown")}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-600 transition-colors duration-200 hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {ADMIN_OPPORTUNITY_ACTION_LABELS.takedown}
              </button>
            )
          )}
          {opportunity.status !== "closed" && (
            <button
              type="button"
              onClick={() => onAction("close")}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_OPPORTUNITY_ACTION_LABELS.close}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
