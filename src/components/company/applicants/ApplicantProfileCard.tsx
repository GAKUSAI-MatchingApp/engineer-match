import { Mail, MapPin } from "lucide-react";
import { WORK_STYLE_LABEL } from "@/constants/jobs";
import { AVAILABILITY_STATUS_OPTIONS, JOB_CATEGORY_OPTIONS } from "@/constants/engineer-profile";
import { APPLICANT_DETAIL_META } from "@/constants/company-applicants";
import type { ApplicantDetail } from "@/lib/company/applicants";

interface ApplicantProfileCardProps {
  applicant: ApplicantDetail;
}

export function ApplicantProfileCard({ applicant }: ApplicantProfileCardProps) {
  const hasRateRange =
    applicant.desiredHourlyRateMin !== null && applicant.desiredHourlyRateMax !== null;
  const jobCategoryLabel = JOB_CATEGORY_OPTIONS.find((o) => o.value === applicant.jobCategory)?.label;
  const availabilityLabel = AVAILABILITY_STATUS_OPTIONS.find(
    (o) => o.value === applicant.availabilityStatus,
  )?.label;

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <h3 className="text-base font-semibold text-foreground">
        {APPLICANT_DETAIL_META.profileSummaryTitle}
      </h3>

      {applicant.selfPr && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{applicant.selfPr}</p>
      )}

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {applicant.jobTitle && (
          <div>
            <dt className="text-xs text-muted-foreground">職種</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{applicant.jobTitle}</dd>
          </div>
        )}
        {jobCategoryLabel && (
          <div>
            <dt className="text-xs text-muted-foreground">職種カテゴリ</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{jobCategoryLabel}</dd>
          </div>
        )}
        {availabilityLabel && (
          <div>
            <dt className="text-xs text-muted-foreground">稼働状況</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{availabilityLabel}</dd>
          </div>
        )}
        {applicant.yearsOfExperience !== null && (
          <div>
            <dt className="text-xs text-muted-foreground">経験年数</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {applicant.yearsOfExperience}年
            </dd>
          </div>
        )}
        {applicant.prefecture && (
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              勤務地
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{applicant.prefecture}</dd>
          </div>
        )}
        {applicant.workStyle && (
          <div>
            <dt className="text-xs text-muted-foreground">希望勤務形態</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {WORK_STYLE_LABEL[applicant.workStyle]}
            </dd>
          </div>
        )}
        {hasRateRange && (
          <div>
            <dt className="text-xs text-muted-foreground">希望単価</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {applicant.desiredHourlyRateMin}円〜{applicant.desiredHourlyRateMax}円/時間
            </dd>
          </div>
        )}
        <div className="min-w-0 sm:col-span-2">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            メールアドレス
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground break-all">
            <a
              href={`mailto:${applicant.email}`}
              className="text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {applicant.email}
            </a>
          </dd>
        </div>
        {applicant.portfolioUrl && (
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Portfolio URL</dt>
            <dd className="mt-1 text-sm font-medium break-all">
              <a
                href={applicant.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {applicant.portfolioUrl}
              </a>
            </dd>
          </div>
        )}
        {applicant.githubUrl && (
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">GitHub</dt>
            <dd className="mt-1 text-sm font-medium break-all">
              <a
                href={applicant.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {applicant.githubUrl}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
