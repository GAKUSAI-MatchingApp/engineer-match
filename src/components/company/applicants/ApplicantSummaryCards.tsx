import { memo } from "react";
import { FileText, MessagesSquare, UserCheck, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import type { ApplicantListItem } from "@/lib/company/applicants";
import { SUMMARY_CARDS } from "@/constants/company-applicants";

const ICON_MAP = {
  users: Users,
  fileText: FileText,
  messagesSquare: MessagesSquare,
  userCheck: UserCheck,
} as const;

interface ApplicantSummaryCardsProps {
  applicants: ApplicantListItem[];
}

export const ApplicantSummaryCards = memo(function ApplicantSummaryCards({
  applicants,
}: ApplicantSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SUMMARY_CARDS.map((card) => {
        const count = card.statuses
          ? applicants.filter((applicant) => card.statuses!.includes(applicant.status))
              .length
          : applicants.length;

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
