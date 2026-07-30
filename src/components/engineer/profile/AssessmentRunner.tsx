"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, X } from "lucide-react";
import {
  ASSESSMENT_ACTION_LABELS,
  ASSESSMENT_ANSWER_LABELS,
  ASSESSMENT_ERROR_LABELS,
  ASSESSMENT_PAGE_META,
  ASSESSMENT_PROGRESS_LABELS,
  ASSESSMENT_RESULT_LABELS,
} from "@/constants/skill-assessment";
import {
  formatDiagnosisLevelLabel,
  formatDiagnosisResultMessage,
  type DiagnosisLevel,
} from "@/constants/skill-levels";
import {
  computeAssessmentScore,
  submitAssessment,
  type SkillAssessment,
  type SkillAssessmentQuestion,
} from "@/lib/engineer/skill-assessments";
import { createClient } from "@/lib/supabase/client";

interface AssessmentRunnerProps {
  assessment: SkillAssessment;
  questions: SkillAssessmentQuestion[];
  userId: string;
}

export function AssessmentRunner({ assessment, questions, userId }: AssessmentRunnerProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    yesCount: number;
    yesCountLevel: number;
    cumulativeLevel: number;
    finalLevel: number;
  } | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const groupedByLevel = useMemo(() => {
    const groups = new Map<number, SkillAssessmentQuestion[]>();
    for (const question of questions) {
      const list = groups.get(question.level) ?? [];
      list.push(question);
      groups.set(question.level, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a - b);
  }, [questions]);

  function selectAnswer(questionId: string, value: boolean) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!allAnswered || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const answersInOrder = [...questions]
      .sort((a, b) => a.question_order - b.question_order)
      .map((question) => answers[question.id]);

    const score = computeAssessmentScore(answersInOrder);

    const supabase = createClient();
    const { data, error } = await submitAssessment(
      supabase,
      userId,
      assessment.id,
      questions.map((question) => ({ questionId: question.id, value: answers[question.id] })),
      score,
    );

    setIsSubmitting(false);

    if (error || !data) {
      console.error("[assessment-runner] submit failed:", error);
      setErrorMessage(ASSESSMENT_ERROR_LABELS.submitFailedMessage);
      return;
    }

    setResult(score);
    router.refresh();
  }

  if (result) {
    const finalLevel = result.finalLevel as DiagnosisLevel;
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {ASSESSMENT_RESULT_LABELS.title}
            </h2>
            <p className="text-sm text-muted-foreground">{assessment.name}</p>
          </div>
        </div>

        <p className="mt-6 text-4xl font-bold text-primary">{formatDiagnosisLevelLabel(finalLevel)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {ASSESSMENT_RESULT_LABELS.yesCountPrefix} {result.yesCount}{" "}
          {ASSESSMENT_RESULT_LABELS.yesCountSuffix}
        </p>

        <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-foreground">
          {formatDiagnosisResultMessage(finalLevel)}
        </p>

        <Link
          href={ASSESSMENT_PAGE_META.backHref}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {ASSESSMENT_ACTION_LABELS.backToProfile}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-16 z-10 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">{assessment.name}</span>
          <span className="font-medium text-muted-foreground">
            {answeredCount} / {questions.length} {ASSESSMENT_PROGRESS_LABELS.suffix}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-label={`${assessment.name} ${ASSESSMENT_PROGRESS_LABELS.suffix}`}
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {groupedByLevel.map(([level, levelQuestions]) => (
          <section
            key={level}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
          >
            <h3 className="text-xs font-semibold text-muted-foreground">
              {formatDiagnosisLevelLabel(level as DiagnosisLevel)}
            </h3>
            <ul className="mt-3 flex flex-col gap-4">
              {levelQuestions.map((question) => {
                const answer = answers[question.id];
                return (
                  <li key={question.id} className="flex flex-col gap-2.5">
                    <p className="text-sm leading-relaxed text-foreground">
                      {question.question_order}. {question.question_text}
                    </p>
                    <div
                      role="radiogroup"
                      aria-label={question.question_text}
                      className="flex gap-2.5"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={answer === true}
                        onClick={() => selectAnswer(question.id, true)}
                        className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none sm:flex-none sm:w-28 ${
                          answer === true
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface text-foreground hover:bg-muted"
                        }`}
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        {ASSESSMENT_ANSWER_LABELS.yes}
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={answer === false}
                        onClick={() => selectAnswer(question.id, false)}
                        className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none sm:flex-none sm:w-28 ${
                          answer === false
                            ? "border-foreground bg-foreground text-white"
                            : "border-border bg-surface text-foreground hover:bg-muted"
                        }`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        {ASSESSMENT_ANSWER_LABELS.no}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <div className="sticky bottom-4 z-10 rounded-2xl border border-border bg-surface p-4 shadow-lg sm:p-5">
        {!allAnswered && (
          <p className="mb-3 text-xs text-muted-foreground">
            {ASSESSMENT_ACTION_LABELS.incompleteNote}
          </p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {isSubmitting ? ASSESSMENT_ACTION_LABELS.submitting : ASSESSMENT_ACTION_LABELS.submit}
        </button>
      </div>
    </div>
  );
}
