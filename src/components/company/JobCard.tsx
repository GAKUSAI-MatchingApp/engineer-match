"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Eye, SquarePen, Users } from "lucide-react";
import { JobStatusBadge } from "@/components/company/JobStatusBadge";
import { DeleteJobDialog } from "@/components/company/DeleteJobDialog";
import type { OpportunityListItem } from "@/lib/company/jobs";
import {
  CONTRACT_TYPE_BADGE_STYLES,
  CONTRACT_TYPE_LABEL,
  JOB_CARD_LABELS,
  WORK_STYLE_BADGE_STYLES,
  WORK_STYLE_LABEL,
} from "@/constants/company-jobs";

interface JobCardProps {
  job: OpportunityListItem;
  onCloseRecruitment: (id: string) => Promise<void>;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatCompensation(job: OpportunityListItem): string {
  if (job.contract_type === "employment" && job.salaryMin != null && job.salaryMax != null) {
    return `年収 ${job.salaryMin}万円〜${job.salaryMax}万円`;
  }
  if (job.contract_type === "project" && job.budget != null) {
    return `予算 ${job.budget}万円`;
  }
  if (job.contract_type === "hourly" && job.hourlyRate != null) {
    return `時給 ${job.hourlyRate.toLocaleString("ja-JP")}円`;
  }
  return "";
}

export function JobCard({ job, onCloseRecruitment }: JobCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const canClose = job.status === "published" || job.status === "draft";
  const compensation = formatCompensation(job);

  async function handleConfirmClose() {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await onCloseRecruitment(job.id);
    } finally {
      setIsClosing(false);
      setIsDialogOpen(false);
    }
  }

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-5">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${CONTRACT_TYPE_BADGE_STYLES[job.contract_type]}`}
        >
          {CONTRACT_TYPE_LABEL[job.contract_type]}
        </span>
        <JobStatusBadge status={job.status} className="text-[11px]" />
        {job.workStyle && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${WORK_STYLE_BADGE_STYLES[job.workStyle]}`}
          >
            {WORK_STYLE_LABEL[job.workStyle]}
          </span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-12 text-base leading-6 font-semibold text-foreground">
        {job.title}
      </h3>

      {compensation && (
        <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-sm font-bold text-foreground">
          {compensation}
        </p>
      )}

      {job.requiredSkillNames.length > 0 && (
        <ul className="mt-3 flex min-w-0 flex-wrap gap-1.5">
          {job.requiredSkillNames.slice(0, 4).map((skill) => (
            <li
              key={skill}
              title={skill}
              className="inline-flex max-w-full items-center truncate rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
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

      <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">
            {JOB_CARD_LABELS.applicantCountPrefix}
            {job.applicantCount}
            {JOB_CARD_LABELS.applicantCountSuffix}
          </span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {JOB_CARD_LABELS.createdPrefix}
            {formatDate(job.created_at)}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {JOB_CARD_LABELS.updatedPrefix}
            {formatDate(job.updated_at)}
          </span>
        </span>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <Link
          href={`/company/jobs/${job.id}`}
          className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {JOB_CARD_LABELS.detailLabel}
        </Link>
        <Link
          href={`/company/jobs/${job.id}/edit`}
          className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <SquarePen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {JOB_CARD_LABELS.editLabel}
        </Link>
        <Link
          href={`/company/applicants?job=${encodeURIComponent(job.title)}`}
          className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{JOB_CARD_LABELS.applicantsLabel}</span>
        </Link>
        {canClose && (
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            disabled={isClosing}
            className="inline-flex h-10 min-w-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
          >
            {JOB_CARD_LABELS.closeLabel}
          </button>
        )}
      </div>

      <DeleteJobDialog
        isOpen={isDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmClose}
      />
    </article>
  );
}
