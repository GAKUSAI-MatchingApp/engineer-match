import { Building2 } from "lucide-react";
import {
  APPLY_SIDEBAR_LABELS,
  CONTRACT_TYPE_BADGE_STYLES,
  CONTRACT_TYPE_LABEL,
  WORK_STYLE_BADGE_STYLES,
  WORK_STYLE_LABEL,
} from "@/constants/jobs";
import { formatDateJa, formatSalaryLabelFromDetail } from "@/lib/engineer/format";
import type { EngineerJobDetail } from "@/lib/engineer/opportunities";

interface JobDetailHeroProps {
  detail: EngineerJobDetail;
}

export function JobDetailHero({ detail }: JobDetailHeroProps) {
  const { opportunity, employment, project, hourly, company } = detail;
  const salaryLabel = formatSalaryLabelFromDetail({
    contractType: opportunity.contract_type as "employment" | "project" | "hourly",
    employment,
    project,
    hourly,
  });
  // Phase 5 決定事項②: hourly gained its own work_style
  // (063_opportunity_hourly_work_style.sql draft); NULL on legacy rows, so
  // the badge simply doesn't render for those, same as it already didn't
  // for project (which has no work_style concept at all).
  const workStyle = employment?.work_style ?? hourly?.work_style ?? null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${CONTRACT_TYPE_BADGE_STYLES[opportunity.contract_type]}`}
        >
          {CONTRACT_TYPE_LABEL[opportunity.contract_type]}
        </span>
        {workStyle && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${WORK_STYLE_BADGE_STYLES[workStyle]}`}
          >
            {WORK_STYLE_LABEL[workStyle]}
          </span>
        )}
      </div>

      <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {opportunity.title}
      </h2>

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4" aria-hidden="true" />
          <dt className="sr-only">会社名</dt>
          <dd>{company?.company_name ?? ""}</dd>
        </div>
        <div>
          <dt className="sr-only">{APPLY_SIDEBAR_LABELS.updatedLabel}</dt>
          <dd>
            {APPLY_SIDEBAR_LABELS.updatedLabel}：{formatDateJa(opportunity.updated_at)}
          </dd>
        </div>
      </dl>

      {salaryLabel && (
        <p className="mt-4 text-lg font-semibold text-primary">{salaryLabel}</p>
      )}
    </div>
  );
}
