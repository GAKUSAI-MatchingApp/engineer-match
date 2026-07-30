import Link from "next/link";
import { HUMAN_SKILL_CARD_LABELS } from "@/constants/skill-assessment";
import { formatDiagnosisLevelLabel, type DiagnosisLevel } from "@/constants/skill-levels";

interface HumanSkillAssessmentCardProps {
  name: string;
  code: string;
  finalLevel: number | null;
}

export function HumanSkillAssessmentCard({
  name,
  code,
  finalLevel,
}: HumanSkillAssessmentCardProps) {
  const isAssessed = finalLevel !== null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-1 text-sm">
          {isAssessed ? (
            <span className="font-semibold text-primary">
              {formatDiagnosisLevelLabel(finalLevel as DiagnosisLevel)}
            </span>
          ) : (
            <span className="text-muted-foreground">{HUMAN_SKILL_CARD_LABELS.notAssessed}</span>
          )}
        </p>
      </div>
      <Link
        href={`/engineer/profile/assessments/${code}`}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {isAssessed ? HUMAN_SKILL_CARD_LABELS.retakeLabel : HUMAN_SKILL_CARD_LABELS.startLabel}
      </Link>
    </div>
  );
}
