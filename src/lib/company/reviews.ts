import type { SupabaseClient } from "@supabase/supabase-js";

export interface CompanyReviewRecord {
  id: string;
  rating: number;
  comment: string;
  engineerReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapReviewRow(data: Record<string, unknown>): CompanyReviewRecord {
  return {
    id: data.id as string,
    rating: data.rating as number,
    comment: data.comment as string,
    engineerReply: (data.engineer_reply as string | null) ?? null,
    repliedAt: (data.replied_at as string | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

/** The review this company authored for one application, if any (engineer_reviews_select_own_company RLS). */
export async function getReviewForApplication(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<CompanyReviewRecord | null> {
  const { data, error } = await supabase
    .from("engineer_reviews")
    .select("id, rating, comment, engineer_reply, replied_at, created_at, updated_at")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("[company-reviews] failed to load review:", error);
    return null;
  }
  if (!data) return null;

  return mapReviewRow(data);
}

export interface CreateReviewInput {
  applicationId: string;
  opportunityId: string;
  companyUserId: string;
  engineerUserId: string;
  rating: number;
  comment: string;
}

/**
 * Insert-only creation of a company's review for one completed application.
 * Eligibility (opportunity ownership, application<->engineer match,
 * status='completed') and the one-review-per-application rule are both
 * enforced by engineer_reviews_insert_company RLS +
 * uq_engineer_reviews_application (050_engineer_reviews.sql) — this function
 * does not duplicate those checks.
 */
export async function createEngineerReview(supabase: SupabaseClient, input: CreateReviewInput) {
  const { data, error } = await supabase
    .from("engineer_reviews")
    .insert({
      application_id: input.applicationId,
      opportunity_id: input.opportunityId,
      company_user_id: input.companyUserId,
      engineer_user_id: input.engineerUserId,
      rating: input.rating,
      comment: input.comment,
    })
    .select("id, rating, comment, engineer_reply, replied_at, created_at, updated_at")
    .single();

  return { data: data ? mapReviewRow(data) : null, error };
}

/**
 * Company may edit its own rating/comment after posting —
 * engineer_reviews_update_company RLS forbids touching engineer_reply/
 * replied_at or reassigning the row.
 */
export async function updateEngineerReview(
  supabase: SupabaseClient,
  reviewId: string,
  input: { rating: number; comment: string },
) {
  const { data, error } = await supabase
    .from("engineer_reviews")
    .update({ rating: input.rating, comment: input.comment })
    .eq("id", reviewId)
    .select("id, rating, comment, engineer_reply, replied_at, created_at, updated_at")
    .single();

  return { data: data ? mapReviewRow(data) : null, error };
}
