import Link from "next/link";
import { Building2, CalendarDays, Flag, Users } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import {
  ADMIN_OPPORTUNITY_ACTION_LABELS,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_BADGE_STYLES,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL,
  ADMIN_OPPORTUNITY_SIDE_LABEL,
  ADMIN_OPPORTUNITY_STATUS_LABEL,
  ADMIN_OPPORTUNITY_STATUS_TONE,
  ADMIN_OPPORTUNITY_WORK_STYLE_LABEL,
} from "@/constants/admin-opportunities";
import type {
  AdminOpportunityListItem,
  AdminOpportunityModerationAction,
} from "@/lib/admin/opportunities";

interface AdminOpportunityMobileCardsProps {
  opportunities: AdminOpportunityListItem[];
  onAction: (id: string, action: AdminOpportunityModerationAction) => void;
}

const SECONDARY_ACTION_CLASS =
  "inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none";

export function AdminOpportunityMobileCards({
  opportunities,
  onAction,
}: AdminOpportunityMobileCardsProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
      {opportunities.map((opp) => (
        <article
          key={opp.id}
          className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-5"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${ADMIN_OPPORTUNITY_CONTRACT_TYPE_BADGE_STYLES[opp.contractType]}`}
            >
              {ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[opp.contractType]}
            </span>
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
            <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {ADMIN_OPPORTUNITY_SIDE_LABEL[opp.side]}
            </span>
            {opp.workStyle && (
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                {ADMIN_OPPORTUNITY_WORK_STYLE_LABEL[opp.workStyle] ?? opp.workStyle}
              </span>
            )}
          </div>

          <Link
            href={`/admin/opportunities/${opp.id}`}
            className="mt-3 line-clamp-2 min-h-12 rounded text-base leading-6 font-semibold text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {opp.title}
          </Link>
          <Link
            href={`/admin/companies/${opp.companyId}`}
            className="mt-1 flex min-w-0 items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{opp.companyName || "企業名未登録"}</span>
          </Link>

          {opp.conditionsLabel && (
            <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-sm font-bold text-foreground">
              {opp.conditionsLabel}
            </p>
          )}

          {opp.requiredSkillNames.length > 0 && (
            <ul className="mt-3 flex min-w-0 flex-wrap gap-1.5">
              {opp.requiredSkillNames.slice(0, 4).map((skill) => (
                <li
                  key={skill}
                  title={skill}
                  className="inline-flex max-w-full truncate rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {skill}
                </li>
              ))}
              {opp.requiredSkillNames.length > 4 && (
                <li className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  +{opp.requiredSkillNames.length - 4}
                </li>
              )}
            </ul>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground">
              <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">応募 {opp.applicantCount}名</span>
            </div>
            {opp.latestReportId ? (
              <Link
                href={`/admin/reports/${opp.latestReportId}`}
                className="flex min-w-0 items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Flag className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">通報 {opp.reportCount}件</span>
              </Link>
            ) : (
              <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <Flag className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">通報 0件</span>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">作成 {opp.createdAtLabel}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">更新 {opp.updatedAtLabel}</span>
            </span>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
            <Link href={`/admin/opportunities/${opp.id}`} className={SECONDARY_ACTION_CLASS}>
              {ADMIN_OPPORTUNITY_ACTION_LABELS.viewDetails}
            </Link>
            <Link href={`/admin/companies/${opp.companyId}`} className={SECONDARY_ACTION_CLASS}>
              {ADMIN_OPPORTUNITY_ACTION_LABELS.viewCompany}
            </Link>
            {opp.unpublishedByAdmin ? (
              <button
                type="button"
                onClick={() => onAction(opp.id, "republish")}
                className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {ADMIN_OPPORTUNITY_ACTION_LABELS.republish}
              </button>
            ) : (
              opp.status === "published" && (
                <button
                  type="button"
                  onClick={() => onAction(opp.id, "takedown")}
                  className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ADMIN_OPPORTUNITY_ACTION_LABELS.takedown}
                </button>
              )
            )}
            {opp.status !== "closed" && (
              <button
                type="button"
                onClick={() => onAction(opp.id, "close")}
                className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {ADMIN_OPPORTUNITY_ACTION_LABELS.close}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
