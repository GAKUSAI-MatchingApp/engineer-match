import { ItssBadge } from "@/components/engineer/profile/ItssBadge";
import { formatItssLevelLabel } from "@/constants/skill-levels";

interface TechnicalSkillCardProps {
  variant: "technical";
  name: string;
  itssLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** user_skills.experience_years, per 042_user_skills_experience_years.sql. */
  experienceYears?: number | null;
}

interface RatedSkillCardProps {
  variant: "rated";
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

type SkillCardProps = TechnicalSkillCardProps | RatedSkillCardProps;

export function SkillCard(props: SkillCardProps) {
  if (props.variant === "technical") {
    const { name, itssLevel, experienceYears } = props;
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border p-4">
        <ItssBadge level={itssLevel} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatItssLevelLabel(itssLevel)}
            {experienceYears !== undefined && experienceYears !== null && (
              <span>（経験年数 {experienceYears}年）</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  const { name, rating } = props;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <div
          className="mt-1.5 flex items-center gap-1"
          role="img"
          aria-label={`自己評価 ${rating} / 5`}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`h-2 w-6 rounded-full ${
                index < rating ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">
            {rating}/5
          </span>
        </div>
      </div>
    </div>
  );
}
