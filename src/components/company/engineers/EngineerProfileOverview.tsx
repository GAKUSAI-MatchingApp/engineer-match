import { UserRound } from "lucide-react";
import { WORK_STYLE_LABEL } from "@/constants/jobs";
import { ENGINEER_DETAIL_META } from "@/constants/company-engineers";
import type { EngineerDetail } from "@/lib/company/engineers";

interface EngineerProfileOverviewProps {
  engineer: EngineerDetail;
}

export function EngineerProfileOverview({ engineer }: EngineerProfileOverviewProps) {
  const hasRateRange =
    engineer.desiredHourlyRateMin !== null && engineer.desiredHourlyRateMax !== null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {ENGINEER_DETAIL_META.overviewTitle}
        </h3>
      </div>

      {engineer.selfPr && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{engineer.selfPr}</p>
      )}

      <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
        {engineer.yearsOfExperience !== null && (
          <div>
            <dt className="text-xs text-muted-foreground">経験年数</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {engineer.yearsOfExperience}年
            </dd>
          </div>
        )}
        {engineer.prefecture && (
          <div>
            <dt className="text-xs text-muted-foreground">居住地</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{engineer.prefecture}</dd>
          </div>
        )}
        {engineer.workStyle && (
          <div>
            <dt className="text-xs text-muted-foreground">希望の働き方</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {WORK_STYLE_LABEL[engineer.workStyle]}
            </dd>
          </div>
        )}
        {hasRateRange && (
          <div>
            <dt className="text-xs text-muted-foreground">希望単価</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {engineer.desiredHourlyRateMin}円〜{engineer.desiredHourlyRateMax}円/時間
            </dd>
          </div>
        )}
        {engineer.portfolioUrl && (
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Portfolio URL</dt>
            <dd className="mt-1 text-sm font-medium break-all">
              <a
                href={engineer.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {engineer.portfolioUrl}
              </a>
            </dd>
          </div>
        )}
        {engineer.githubUrl && (
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">GitHub</dt>
            <dd className="mt-1 text-sm font-medium break-all">
              <a
                href={engineer.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {engineer.githubUrl}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
