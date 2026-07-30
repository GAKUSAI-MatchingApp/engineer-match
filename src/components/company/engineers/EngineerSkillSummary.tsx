import { ItssBadge } from "@/components/engineer/profile/ItssBadge";
import { ENGINEER_CARD_LABELS } from "@/constants/company-engineers";
import { formatItssLevelLabel } from "@/constants/skill-levels";

interface EngineerSkillSummaryProps {
  skills: string[];
  maxItssLevel: number;
}

export function EngineerSkillSummary({ skills, maxItssLevel }: EngineerSkillSummaryProps) {
  const level = Math.min(Math.max(maxItssLevel, 1), 7) as 1 | 2 | 3 | 4 | 5 | 6 | 7;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <ItssBadge level={level} size="sm" />
        {ENGINEER_CARD_LABELS.itssLabel} {formatItssLevelLabel(level)}
      </span>
      <ul className="flex flex-wrap gap-1.5">
        {skills.slice(0, 5).map((skill) => (
          <li
            key={skill}
            className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
          >
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
}
