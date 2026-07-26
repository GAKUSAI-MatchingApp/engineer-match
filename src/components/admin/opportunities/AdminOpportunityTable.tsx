import Link from "next/link";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_OPPORTUNITY_ACTION_LABELS,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL,
  ADMIN_OPPORTUNITY_STATUS_LABEL,
  ADMIN_OPPORTUNITY_STATUS_TONE,
  ADMIN_OPPORTUNITY_TABLE_COLUMNS,
} from "@/constants/admin-opportunities";
import type { AdminOpportunityListItem, AdminOpportunityModerationAction } from "@/lib/admin/opportunities";

interface AdminOpportunityTableProps {
  opportunities: AdminOpportunityListItem[];
  onAction: (id: string, action: AdminOpportunityModerationAction) => void;
}

export function AdminOpportunityTable({ opportunities, onAction }: AdminOpportunityTableProps) {
  return (
    <AdminDataTable
      columns={[...ADMIN_OPPORTUNITY_TABLE_COLUMNS]}
      caption={ADMIN_OPPORTUNITY_TABLE_COLUMNS.join("、")}
    >
      {opportunities.map((opp) => (
        <tr key={opp.id} className="align-top">
          <td className="px-4 py-3">
            <Link
              href={`/admin/opportunities/${opp.id}`}
              className="line-clamp-2 max-w-xs rounded text-sm font-semibold text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {opp.title}
            </Link>
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-foreground">{opp.companyName}</td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[opp.contractType]}
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-foreground">{opp.applicantCount}名</td>
          <td className="px-4 py-3">
            <AdminStatusBadge
              label={opp.unpublishedByAdmin ? "管理者非公開" : ADMIN_OPPORTUNITY_STATUS_LABEL[opp.status]}
              tone={opp.unpublishedByAdmin ? "negative" : ADMIN_OPPORTUNITY_STATUS_TONE[opp.status]}
            />
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {opp.createdAtLabel}
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
                  className="rounded text-xs font-semibold text-emerald-600 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ADMIN_OPPORTUNITY_ACTION_LABELS.republish}
                </button>
              ) : (
                opp.status === "published" && (
                  <button
                    type="button"
                    onClick={() => onAction(opp.id, "takedown")}
                    className="rounded text-xs font-semibold text-amber-600 hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {ADMIN_OPPORTUNITY_ACTION_LABELS.takedown}
                  </button>
                )
              )}
              {opp.status !== "closed" && (
                <button
                  type="button"
                  onClick={() => onAction(opp.id, "close")}
                  className="rounded text-xs font-semibold text-red-600 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ADMIN_OPPORTUNITY_ACTION_LABELS.close}
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
