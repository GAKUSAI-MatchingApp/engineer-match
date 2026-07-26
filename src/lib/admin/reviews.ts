import type { SupabaseClient } from "@supabase/supabase-js";

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export interface AdminReviewListItem {
  id: string;
  applicationId: string;
  opportunityId: string;
  opportunityTitle: string;
  companyUserId: string;
  companyName: string;
  engineerUserId: string;
  engineerName: string;
  rating: number;
  comment: string;
  engineerReply: string | null;
  repliedAtLabel: string | null;
  createdAtLabel: string;
  createdAtISO: string;
}

const LIST_CAP = 1000;

/**
 * Every review on the platform, for admin oversight. Relies on
 * engineer_reviews_select_admin RLS (050_engineer_reviews.sql) to bypass
 * each engineer's own show_reviews toggle -- no new migration needed.
 */
export async function listAllAdminReviews(supabase: SupabaseClient): Promise<AdminReviewListItem[]> {
  const { data: reviews, error } = await supabase
    .from("engineer_reviews")
    .select(
      "id, application_id, opportunity_id, company_user_id, engineer_user_id, rating, comment, engineer_reply, replied_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(LIST_CAP);

  if (error) {
    console.error("[admin] failed to list reviews:", error);
    return [];
  }
  if (!reviews || reviews.length === 0) return [];

  const opportunityIds = [...new Set(reviews.map((row) => row.opportunity_id as string))];
  const companyIds = [...new Set(reviews.map((row) => row.company_user_id as string))];
  const engineerIds = [...new Set(reviews.map((row) => row.engineer_user_id as string))];

  const [{ data: opportunities }, { data: companies }, { data: engineers }] = await Promise.all([
    supabase.from("opportunities").select("id, title").in("id", opportunityIds),
    supabase.from("company_profiles").select("id, company_name").in("id", companyIds),
    supabase.from("users").select("id, name").in("id", engineerIds),
  ]);

  const titleById = new Map((opportunities ?? []).map((row) => [row.id as string, row.title as string]));
  const companyNameById = new Map((companies ?? []).map((row) => [row.id as string, row.company_name as string]));
  const engineerNameById = new Map((engineers ?? []).map((row) => [row.id as string, row.name as string]));

  return reviews.map((row) => ({
    id: row.id as string,
    applicationId: row.application_id as string,
    opportunityId: row.opportunity_id as string,
    opportunityTitle: titleById.get(row.opportunity_id as string) ?? "",
    companyUserId: row.company_user_id as string,
    companyName: companyNameById.get(row.company_user_id as string) ?? "",
    engineerUserId: row.engineer_user_id as string,
    engineerName: engineerNameById.get(row.engineer_user_id as string) ?? "不明なユーザー",
    rating: row.rating as number,
    comment: row.comment as string,
    engineerReply: (row.engineer_reply as string | null) ?? null,
    repliedAtLabel: row.replied_at ? formatDateLabel(row.replied_at as string) : null,
    createdAtLabel: formatDateLabel(row.created_at as string),
    createdAtISO: row.created_at as string,
  }));
}
