import type { LucideIcon } from "lucide-react";
import { APPLICANT_DETAIL_META } from "@/constants/company-applicants";
import { formatDiagnosisLevelLabel, type DiagnosisLevel } from "@/constants/skill-levels";
import type { AssessmentSummary } from "@/lib/company/applicants";

interface ApplicantAssessmentSummaryProps {
  title: string;
  icon: LucideIcon;
  items: AssessmentSummary[];
}

/**
 * Read-only — shows only the final visible level, never the individual
 * Yes/No answers (skill_assessment_answers has no company RLS policy at all,
 * by design, and this component never queries that table).
 */
export function ApplicantAssessmentSummary({
  title,
  icon: Icon,
  items,
}: ApplicantAssessmentSummaryProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.code}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
          >
            <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
            {item.finalLevel !== null ? (
              <span className="shrink-0 text-sm font-semibold text-primary">
                {formatDiagnosisLevelLabel(item.finalLevel as DiagnosisLevel)}
              </span>
            ) : (
              <span className="shrink-0 text-sm text-muted-foreground">
                {APPLICANT_DETAIL_META.notAssessedLabel}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
