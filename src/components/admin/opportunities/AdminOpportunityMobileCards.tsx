import Link from "next/link";
import { AdminMobileCardList } from "@/components/admin/shared/AdminMobileCardList";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_OPPORTUNITY_ACTION_LABELS,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL,
  ADMIN_OPPORTUNITY_STATUS_LABEL,
  ADMIN_OPPORTUNITY_STATUS_TONE,
} from "@/constants/admin-opportunities";
import type { AdminOpportunityListItem, AdminOpportunityModerationAction } from "@/lib/admin/opportunities";

interface AdminOpportunityMobileCardsProps {
  opportunities: AdminOpportunityListItem[];
  onAction: (id: string, action: AdminOpportunityModerationAction) => void;
}

export function AdminOpportunityMobileCards({ opportunities, onAction }: AdminOpportunityMobileCardsProps) {
  return (
    <AdminMobileCardList>
      {opportunities.map((opp) => (
        <div key={opp.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/admin/opportunities/${opp.id}`}
                className="rounded text-sm font-semibold text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {opp.title}
              </Link>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{opp.companyName}</p>
            </div>
            <AdminStatusBadge
              label={opp.unpublishedByAdmin ? "管理者非公開" : ADMIN_OPPORTUNITY_STATUS_LABEL[opp.status]}
              tone={opp.unpublishedByAdmin ? "negative" : ADMIN_OPPORTUNITY_STATUS_TONE[opp.status]}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[opp.contractType]}</span>
            <span>・</span>
            <span>応募 {opp.applicantCount}名</span>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">{opp.createdAtLabel}</div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
            <Link
              href={`/admin/opportunities/${opp.id}`}
              className="rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_OPPORTUNITY_ACTION_LABELS.viewDetails}
            </Link>
            {opp.unpublishedByAdmin ? (
              <button
                type="button"
                onClick={() => onAction(opp.id, "republish")}
                className="rounded text-xs font-semibold text-emerald-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {ADMIN_OPPORTUNITY_ACTION_LABELS.republish}
              </button>
            ) : (
              opp.status === "published" && (
                <button
                  type="button"
                  onClick={() => onAction(opp.id, "takedown")}
                  className="rounded text-xs font-semibold text-amber-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ADMIN_OPPORTUNITY_ACTION_LABELS.takedown}
                </button>
              )
            )}
            {opp.status !== "closed" && (
              <button
                type="button"
                onClick={() => onAction(opp.id, "close")}
                className="rounded text-xs font-semibold text-red-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {ADMIN_OPPORTUNITY_ACTION_LABELS.close}
              </button>
            )}
          </div>
        </div>
      ))}
    </AdminMobileCardList>
  );
}
