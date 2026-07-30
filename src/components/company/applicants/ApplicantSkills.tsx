import { Code2 } from "lucide-react";
import { ItssBadge } from "@/components/engineer/profile/ItssBadge";
import { APPLICANT_DETAIL_META } from "@/constants/company-applicants";
import { formatItssLevelLabel } from "@/constants/skill-levels";

interface TechnicalSkillItem {
  name: string;
  level: number | null;
  experienceYears?: number | null;
}

interface ApplicantSkillsProps {
  skills: TechnicalSkillItem[];
}

export function ApplicantSkills({ skills }: ApplicantSkillsProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Code2 className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {APPLICANT_DETAIL_META.skillsTitle}
        </h3>
      </div>
      {skills.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {APPLICANT_DETAIL_META.noSkillsMessage}
        </p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li
              key={skill.name}
              title={skill.level !== null ? formatItssLevelLabel(skill.level as 1 | 2 | 3 | 4 | 5 | 6 | 7) : undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pr-3 pl-1.5 text-xs font-medium text-primary"
            >
              {skill.level !== null && (
                <ItssBadge level={skill.level as 1 | 2 | 3 | 4 | 5 | 6 | 7} size="sm" />
              )}
              {skill.name}
              {skill.experienceYears !== undefined && skill.experienceYears !== null && (
                <span className="text-primary/70">（{skill.experienceYears}年）</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
