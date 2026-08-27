"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { useApplicantStatusContext } from "@/components/company/applicants/ApplicantStatusBadge";
import { StarRatingDisplay } from "@/components/reviews/StarRatingDisplay";
import { StarRatingInput } from "@/components/reviews/StarRatingInput";
import { Textarea } from "@/components/ui/textarea";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { COMPANY_REVIEW_ACTION_LABELS, REVIEW_SECTION_LABELS } from "@/constants/reviews";
import { createEngineerReview, updateEngineerReview, type CompanyReviewRecord } from "@/lib/company/reviews";
import { createClient } from "@/lib/supabase/client";

interface ApplicantReviewSectionProps {
  applicationId: string;
  opportunityId: string;
  companyUserId: string;
  engineerUserId: string;
  initialReview: CompanyReviewRecord | null;
}

/**
 * Company review-creation/edit UI, shown on the Applicant Detail page only
 * once the application has reached 'completed' (049_application_completion_
 * status.sql). Reads live status from ApplicantStatusProvider so the "この
 * エンジニアを評価する" action appears immediately after the company marks
 * the work complete, without a page reload.
 */
export function ApplicantReviewSection({
  applicationId,
  opportunityId,
  companyUserId,
  engineerUserId,
  initialReview,
}: ApplicantReviewSectionProps) {
  const { status } = useApplicantStatusContext();
  const [review, setReview] = useState(initialReview);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (status !== "completed") return null;

  function startEditing() {
    setRating(review?.rating ?? 0);
    setComment(review?.comment ?? "");
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    if (rating < 1) {
      setError(COMPANY_REVIEW_ACTION_LABELS.validationRatingRequired);
      return;
    }
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setError(COMPANY_REVIEW_ACTION_LABELS.validationCommentRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: submitError } = review
      ? await updateEngineerReview(supabase, review.id, { rating, comment: trimmedComment })
      : await createEngineerReview(supabase, {
          applicationId,
          opportunityId,
          companyUserId,
          engineerUserId,
          rating,
          comment: trimmedComment,
        });

    setIsSubmitting(false);

    if (submitError || !data) {
      console.error("[company-reviews] failed to save review:", submitError);
      setError(COMPANY_REVIEW_ACTION_LABELS.submitError);
      return;
    }

    const wasUpdate = Boolean(review);
    setReview(data);
    setIsEditing(false);
    setSuccess(wasUpdate ? COMPANY_REVIEW_ACTION_LABELS.updateSuccess : COMPANY_REVIEW_ACTION_LABELS.submitSuccess);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Star className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{REVIEW_SECTION_LABELS.title}</h3>
      </div>

      <div className="mt-5">
        {!review && !isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700"
          >
            {COMPANY_REVIEW_ACTION_LABELS.createButtonLabel}
          </button>
        )}

        {review && !isEditing && (
          <div>
            <StarRatingDisplay rating={review.rating} />
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{review.comment}</p>
            <button
              type="button"
              onClick={startEditing}
              className="mt-3 text-xs font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
            >
              {COMPANY_REVIEW_ACTION_LABELS.editButtonLabel}
            </button>
          </div>
        )}

        {isEditing && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                {COMPANY_REVIEW_ACTION_LABELS.ratingLabel}
                <span className="text-destructive">*</span>
              </p>
              <StarRatingInput value={rating} onChange={setRating} disabled={isSubmitting} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                {COMPANY_REVIEW_ACTION_LABELS.commentLabel}
                <span className="text-destructive">*</span>
              </p>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={COMPANY_REVIEW_ACTION_LABELS.commentPlaceholder}
                disabled={isSubmitting}
              />
            </div>
            <FormStatusMessage message={error} status={error ? "error" : null} />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {review ? COMPANY_REVIEW_ACTION_LABELS.updateLabel : COMPANY_REVIEW_ACTION_LABELS.submitLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                disabled={isSubmitting}
                className="text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {COMPANY_REVIEW_ACTION_LABELS.cancelLabel}
              </button>
            </div>
          </div>
        )}

        {success && !isEditing && (
          <FormStatusMessage message={success} status="success" className="mt-3" />
        )}
      </div>
    </section>
  );
}
