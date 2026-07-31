"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { StarRatingDisplay } from "@/components/reviews/StarRatingDisplay";
import { Textarea } from "@/components/ui/textarea";
import { ENGINEER_REPLY_LABELS } from "@/constants/reviews";
import { updateEngineerReply } from "@/lib/engineer/reviews";
import { createClient } from "@/lib/supabase/client";
import type { EngineerReview } from "@/lib/reviews";
import { formatDateJa } from "@/lib/engineer/format";

interface ReviewCardProps {
  review: EngineerReview;
  /** True only on the Engineer's own profile — Company-side read views never reply. */
  canReply: boolean;
}

export function ReviewCard({ review, canReply }: ReviewCardProps) {
  const [savedReply, setSavedReply] = useState(review.engineerReply);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(review.engineerReply ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDraft(savedReply ?? "");
    setError(null);
    setIsEditing(true);
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setError(ENGINEER_REPLY_LABELS.validationRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: submitError } = await updateEngineerReply(supabase, review.id, trimmed);

    setIsSubmitting(false);

    if (submitError || !data) {
      console.error("[reviews] failed to save reply:", submitError);
      setError(ENGINEER_REPLY_LABELS.submitError);
      return;
    }

    setSavedReply(data.engineer_reply as string);
    setIsEditing(false);
  }

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{review.opportunityTitle}</p>
        <StarRatingDisplay rating={review.rating} size="sm" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {review.companyName} ・ {formatDateJa(review.createdAt)}
      </p>
      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{review.comment}</p>

      {savedReply && !isEditing && (
        <div className="mt-4 rounded-lg bg-muted/60 p-4">
          <p className="text-xs font-semibold text-muted-foreground">{ENGINEER_REPLY_LABELS.replyLabel}</p>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{savedReply}</p>
          {canReply && (
            <button
              type="button"
              onClick={startEditing}
              className="mt-2 text-xs font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
            >
              {ENGINEER_REPLY_LABELS.editReplyButtonLabel}
            </button>
          )}
        </div>
      )}

      {!savedReply && !isEditing && canReply && (
        <button
          type="button"
          onClick={startEditing}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
        >
          {ENGINEER_REPLY_LABELS.replyButtonLabel}
        </button>
      )}

      {!savedReply && !canReply && (
        <p className="mt-4 text-xs text-muted-foreground">{ENGINEER_REPLY_LABELS.noReplyYet}</p>
      )}

      {isEditing && (
        <div className="mt-4">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={ENGINEER_REPLY_LABELS.replyPlaceholder}
            disabled={isSubmitting}
          />
          {error && (
            <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {ENGINEER_REPLY_LABELS.submitLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setError(null);
              }}
              disabled={isSubmitting}
              className="text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {ENGINEER_REPLY_LABELS.cancelLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
