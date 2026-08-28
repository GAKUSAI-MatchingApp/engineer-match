import { NotebookPen } from "lucide-react";
import { JOB_DETAIL_SECTION_LABELS } from "@/constants/jobs";

interface CustomRequiredSkillsNoteProps {
  note: string;
}

/**
 * Review #27: free-text supplement for required skills absent from the
 * public.skills master. Rendered separately from the normal skill-id-backed
 * RequiredSkills list -- callers must only mount this when the note is
 * non-empty (see engineer/jobs/[id]/page.tsx).
 */
export function CustomRequiredSkillsNote({ note }: CustomRequiredSkillsNoteProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <NotebookPen className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {JOB_DETAIL_SECTION_LABELS.customRequiredSkillsNoteTitle}
        </h3>
      </div>
      <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {note}
      </p>
    </section>
  );
}
