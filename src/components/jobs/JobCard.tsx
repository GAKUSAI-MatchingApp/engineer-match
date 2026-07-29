"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Building2, CalendarDays, MapPin } from "lucide-react";
import {
  CONTRACT_TYPE_BADGE_STYLES,
  CONTRACT_TYPE_LABEL,
  JOB_LIST_META,
  WORK_STYLE_BADGE_STYLES,
  WORK_STYLE_LABEL,
} from "@/constants/jobs";
import { formatRelativeDaysJa, formatSalaryLabel } from "@/lib/engineer/format";
import type { HydratedOpportunity } from "@/lib/engineer/opportunities";

interface JobCardProps {
  job: HydratedOpportunity;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export function JobCard({ job, isBookmarked, onToggleBookmark }: JobCardProps) {
  const salaryLabel = formatSalaryLabel(job);

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${CONTRACT_TYPE_BADGE_STYLES[job.contract_type]}`}
          >
            {CONTRACT_TYPE_LABEL[job.contract_type]}
          </span>
          {job.workStyle && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${WORK_STYLE_BADGE_STYLES[job.workStyle]}`}
            >
              {WORK_STYLE_LABEL[job.workStyle]}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleBookmark(job.id);
          }}
          aria-pressed={isBookmarked}
          aria-label={
            isBookmarked ? JOB_LIST_META.bookmarkedLabel : JOB_LIST_META.bookmarkLabel
          }
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Bookmark
            className={isBookmarked ? "fill-primary text-primary" : ""}
            aria-hidden="true"
          />
        </button>
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-12 text-base leading-6 font-semibold text-foreground">
        {job.title}
      </h3>
      <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{job.companyName}</span>
      </p>

      {salaryLabel && (
        <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-sm font-bold text-foreground">
          {salaryLabel}
        </p>
      )}

      {(job.workStyle || job.companyPrefecture) && (
        <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {job.workStyle ? WORK_STYLE_LABEL[job.workStyle] : job.companyPrefecture}
          </span>
        </p>
      )}

      {job.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-5 text-muted-foreground">
          {job.description}
        </p>
      )}

      {job.requiredSkillNames.length > 0 && (
        <ul className="mt-3 flex min-w-0 flex-wrap gap-1.5">
          {job.requiredSkillNames.slice(0, 4).map((skill) => (
            <li
              key={skill}
              className="inline-flex max-w-full items-center truncate rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              title={skill}
            >
              {skill}
            </li>
          ))}
          {job.requiredSkillNames.length > 4 && (
            <li className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              +{job.requiredSkillNames.length - 4}
            </li>
          )}
        </ul>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {JOB_LIST_META.updatedPrefix}
              {formatRelativeDaysJa(job.updated_at)}
            </span>
          </span>
          <Link
            href={`/engineer/jobs/${job.id}`}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {JOB_LIST_META.detailButtonLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
