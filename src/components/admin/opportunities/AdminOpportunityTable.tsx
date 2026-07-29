import Link from "next/link";
import { CalendarDays, Flag, Users } from "lucide-react";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_OPPORTUNITY_ACTION_LABELS,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_BADGE_STYLES,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL,
  ADMIN_OPPORTUNITY_SIDE_LABEL,
  ADMIN_OPPORTUNITY_STATUS_LABEL,
  ADMIN_OPPORTUNITY_STATUS_TONE,
  ADMIN_OPPORTUNITY_TABLE_COLUMNS,
  ADMIN_OPPORTUNITY_WORK_STYLE_LABEL,
} from "@/constants/admin-opportunities";
import type {
  AdminOpportunityListItem,
  AdminOpportunityModerationAction,
} from "@/lib/admin/opportunities";

interface AdminOpportunityTableProps {
  opportunities: AdminOpportunityListItem[];
  onAction: (id: string, action: AdminOpportunityModerationAction) => void;
}

export function AdminOpportunityTable({
  opportunities,
  onAction,
}: AdminOpportunityTableProps) {
  return (
    <AdminDataTable
      columns={[...ADMIN_OPPORTUNITY_TABLE_COLUMNS]}
      caption={ADMIN_OPPORTUNITY_TABLE_COLUMNS.join("、")}
    >
      {opportunities.map((opp) => (
        <tr key={opp.id} className="align-top transition-colors hover:bg-muted/20">
          <td className="w-[30%] px-4 py-4">
            <Link
              href={`/admin/opportunities/${opp.id}`}
              className="line-clamp-2 max-w-sm rounded text-sm leading-5 font-semibold text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {opp.title}
            </Link>
            {opp.requiredSkillNames.length > 0 && (
              <ul className="mt-2 flex min-w-0 flex-wrap gap-1">
                {opp.requiredSkillNames.slice(0, 3).map((skill) => (
                  <li
                    key={skill}
                    title={skill}
                    className="inline-flex max-w-32 truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {skill}
                  </li>
                ))}
                {opp.requiredSkillNames.length > 3 && (
                  <li className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    +{opp.requiredSkillNames.length - 3}
                  </li>
                )}
              </ul>
            )}
          </td>

          <td className="max-w-48 px-4 py-4">
            <Link
              href={`/admin/companies/${opp.companyId}`}
              className="line-clamp-2 rounded text-sm font-medium text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {opp.companyName || "企業名未登録"}
            </Link>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {ADMIN_OPPORTUNITY_SIDE_LABEL[opp.side]}
            </p>
          </td>

          <td className="px-4 py-4">
            <div className="flex flex-wrap gap-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${ADMIN_OPPORTUNITY_CONTRACT_TYPE_BADGE_STYLES[opp.contractType]}`}
              >
                {ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[opp.contractType]}
              </span>
              {opp.workStyle && (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {ADMIN_OPPORTUNITY_WORK_STYLE_LABEL[opp.workStyle] ?? opp.workStyle}
                </span>
              )}
            </div>
            {opp.conditionsLabel && (
              <p className="mt-2 text-xs font-semibold whitespace-nowrap text-foreground">
                {opp.conditionsLabel}
              </p>
            )}
          </td>

          <td className="px-4 py-4">
            <AdminStatusBadge
              label={
                opp.unpublishedByAdmin
                  ? "管理者非公開"
                  : ADMIN_OPPORTUNITY_STATUS_LABEL[opp.status]
              }
              tone={
                opp.unpublishedByAdmin
                  ? "negative"
                  : ADMIN_OPPORTUNITY_STATUS_TONE[opp.status]
              }
            />
            <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                応募 {opp.applicantCount}名
              </span>
              {opp.latestReportId ? (
                <Link
                  href={`/admin/reports/${opp.latestReportId}`}
                  className="flex w-fit items-center gap-1 rounded font-semibold text-red-600 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  通報 {opp.reportCount}件
                </Link>
              ) : (
                <span className="flex items-center gap-1">
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  通報 0件
                </span>
              )}
            </div>
          </td>

          <td className="px-4 py-4 text-xs whitespace-nowrap text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              作成 {opp.createdAtLabel}
            </span>
            <span className="mt-1 flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              更新 {opp.updatedAtLabel}
            </span>
          </td>

          <td className="px-4 py-4">
            <div className="flex min-w-28 flex-col items-stretch gap-1.5">
              <Link
                href={`/admin/opportunities/${opp.id}`}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {ADMIN_OPPORTUNITY_ACTION_LABELS.viewDetails}
              </Link>
              {opp.unpublishedByAdmin ? (
                <button
                  type="button"
                  onClick={() => onAction(opp.id, "republish")}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ADMIN_OPPORTUNITY_ACTION_LABELS.republish}
                </button>
              ) : (
                opp.status === "published" && (
                  <button
                    type="button"
                    onClick={() => onAction(opp.id, "takedown")}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {ADMIN_OPPORTUNITY_ACTION_LABELS.takedown}
                  </button>
                )
              )}
              {opp.status !== "closed" && (
                <button
                  type="button"
                  onClick={() => onAction(opp.id, "close")}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
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
