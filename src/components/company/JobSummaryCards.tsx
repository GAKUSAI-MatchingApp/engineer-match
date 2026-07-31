import { memo } from "react";
import { Archive, Briefcase, FilePenLine } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import type { OpportunityListItem } from "@/lib/company/jobs";
import { JOB_SUMMARY_CARD_META } from "@/constants/company-jobs";

const ICON_MAP = {
  briefcase: Briefcase,
  archive: Archive,
  filePenLine: FilePenLine,
} as const;

interface JobSummaryCardsProps {
  jobs: OpportunityListItem[];
}

export const JobSummaryCards = memo(function JobSummaryCards({ jobs }: JobSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {JOB_SUMMARY_CARD_META.map((card) => {
        const count = jobs.filter((job) =>
          (card.statuses as readonly string[]).includes(job.status),
        ).length;
        return (
          <StatCard
            key={card.key}
            label={card.label}
            value={String(count)}
            icon={ICON_MAP[card.icon as keyof typeof ICON_MAP]}
          />
        );
      })}
    </div>
  );
});
