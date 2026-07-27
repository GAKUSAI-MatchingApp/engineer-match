import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * public.engineer_profiles shape, per 004_profile_tables.sql. Hand-written
 * (no Supabase codegen has been run for this project) -- mirrors
 * src/lib/company/profile.ts's CompanyProfile pattern. `id` is both the
 * primary key and the FK to public.users(id) -- one row per engineer account.
 */
export interface EngineerProfile {
  id: string;
  prefecture: string | null;
  years_of_experience: number | null;
  self_pr: string | null;
  work_style: "REMOTE" | "ONSITE" | "HYBRID" | null;
  desired_rate_min: number | null;
  desired_rate_max: number | null;
  portfolio_url: string | null;
  avatar_url: string | null;
  is_public: boolean;
  /** 職種, per 039_engineer_profile_professional_fields.sql. */
  job_title: string | null;
  /** 職種カテゴリ, per chk_engineer_profiles_job_category (039). */
  job_category:
    | "FRONTEND"
    | "BACKEND"
    | "FULLSTACK"
    | "INFRA"
    | "CLOUD"
    | "AI_DATA"
    | "PM"
    | "QA"
    | "SECURITY"
    | null;
  /** 稼働状況, per chk_engineer_profiles_availability_status (039). */
  availability_status: "IMMEDIATE" | "NEGOTIABLE" | "CURRENTLY_EMPLOYED" | "ON_LEAVE" | null;
  github_url: string | null;
  /** 希望年収 (万円), for 契約形態=就職. */
  desired_annual_income_min: number | null;
  desired_annual_income_max: number | null;
  /** 希望時間単価 (円), for 契約形態=時間精算. */
  desired_hourly_rate_min: number | null;
  desired_hourly_rate_max: number | null;
  /** 稼働開始可能日. */
  available_from: string | null;
  /** 評価をプロフィールに表示するか — global toggle, 050_engineer_reviews.sql. */
  show_reviews: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * show_reviews is excluded here the same way avatar_url is: it has its own
 * dedicated update path (updateReviewVisibility, src/lib/engineer/reviews.ts)
 * rather than going through the general profile form.
 */
export type EngineerProfileInput = Omit<
  EngineerProfile,
  "id" | "created_at" | "updated_at" | "avatar_url" | "show_reviews"
>;

/**
 * A freshly-signed-up ENGINEER account has no engineer_profiles row yet -- no
 * trigger creates one at signup (handle_new_user only inserts into
 * public.users). .maybeSingle() returns null for that case instead of
 * throwing, mirroring getCompanyProfile()'s pattern.
 */
export async function getEngineerProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<EngineerProfile | null> {
  const { data, error } = await supabase
    .from("engineer_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[engineer-profile] failed to load engineer_profiles row:", error);
    return null;
  }

  return data as EngineerProfile | null;
}

/**
 * RD 4.2.6: 居住地・経験年数・希望の働き方・希望単価 are required. Re-checked
 * here (not just in BasicProfileForm.tsx) so a caller bypassing the form
 * still can't save an incomplete profile. This only gates what a *new* save
 * writes -- it never touches an existing row that predates this rule, since
 * this function is only ever invoked from an explicit save action.
 */
function validateEngineerProfileInput(input: EngineerProfileInput): boolean {
  if (!input.prefecture || !input.prefecture.trim()) return false;
  if (input.years_of_experience === null || input.years_of_experience === undefined) return false;
  if (!input.work_style) return false;
  if (input.desired_rate_min === null || input.desired_rate_max === null) return false;
  return true;
}

/**
 * Upserts the caller's own engineer_profiles row. Works for both first-time
 * create (no existing row) and subsequent updates -- RLS enforces
 * id = auth.uid() and role = 'ENGINEER' on both the insert and update paths
 * (engineer_profiles_insert_own / engineer_profiles_update_own in
 * 023_profile_policies.sql), so this never needs a service-role client.
 */
export async function saveEngineerProfile(
  supabase: SupabaseClient,
  userId: string,
  input: EngineerProfileInput,
) {
  if (!validateEngineerProfileInput(input)) {
    return { data: null, error: { message: "missing required profile field" } };
  }

  return supabase
    .from("engineer_profiles")
    .upsert({ id: userId, ...input }, { onConflict: "id" })
    .select("*")
    .single();
}

/**
 * public.users.name is the only self-service-editable field on that table
 * besides email (users_update_own RLS, 029_remaining_policies.sql -- role /
 * status / deleted_at are protected). Email is deliberately not editable here
 * since it would desync from the auth.users login email with no reconciliation
 * flow in this project.
 */
export async function updateUserName(
  supabase: SupabaseClient,
  userId: string,
  name: string,
) {
  return supabase.from("users").update({ name }).eq("id", userId).select("id, name").single();
}

export interface EngineerHeaderIdentity {
  name: string;
  email: string;
  initials: string;
}

const ENGINEER_HEADER_FALLBACK_NAME = "エンジニア";

/**
 * Real display identity for the shared UserMenu header (top-right pill +
 * dropdown) -- replaces the old hardcoded USER_MENU.engineer placeholder.
 * On the no-session / missing-row path this falls back to a generic role
 * label, never to a name that could be mistaken for a real signed-in person.
 */
export async function getEngineerHeaderIdentity(
  supabase: SupabaseClient,
  authUser: { id: string; email?: string | null } | null,
): Promise<EngineerHeaderIdentity> {
  if (!authUser) {
    return { name: ENGINEER_HEADER_FALLBACK_NAME, email: "", initials: "?" };
  }

  const { data } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", authUser.id)
    .maybeSingle();

  const name = (data?.name as string | undefined)?.trim() || ENGINEER_HEADER_FALLBACK_NAME;
  const email = (data?.email as string | undefined) ?? authUser.email ?? "";

  return { name, email, initials: name.charAt(0) || "?" };
}

/**
 * Narrow upsert for the Settings page's public-profile toggle -- unlike
 * saveEngineerProfile() this doesn't require the full profile input, since
 * the caller may not have (or want to overwrite) the rest of the row. Must
 * be an upsert rather than a plain update: a freshly-signed-up engineer has
 * no engineer_profiles row yet (see saveEngineerProfile's comment), and a
 * plain .update() against a nonexistent row affects 0 rows without
 * returning an error, which would make the Settings toggle silently no-op
 * while still reporting success.
 */
export async function updateProfileVisibility(
  supabase: SupabaseClient,
  userId: string,
  isPublic: boolean,
) {
  return supabase
    .from("engineer_profiles")
    .upsert({ id: userId, is_public: isPublic }, { onConflict: "id" })
    .select("id, is_public")
    .single();
}

export interface ProfileCompletionInput {
  hasSelfPr: boolean;
  hasPrefecture: boolean;
  hasYearsOfExperience: boolean;
  hasWorkStyle: boolean;
  hasDesiredRate: boolean;
  hasTechnicalSkill: boolean;
  hasQualification: boolean;
  hasJobTitle: boolean;
  hasWorkExperience: boolean;
  hasLanguage: boolean;
}

export interface ProfileCompletionResult {
  percentage: number;
  missingItems: string[];
}

const COMPLETION_ITEM_LABELS: Record<keyof ProfileCompletionInput, string> = {
  hasSelfPr: "自己紹介の入力",
  hasPrefecture: "居住地の入力",
  hasYearsOfExperience: "経験年数の入力",
  hasWorkStyle: "希望の働き方の入力",
  hasDesiredRate: "希望単価の入力",
  hasTechnicalSkill: "テクニカルスキルの登録",
  hasQualification: "資格情報の登録",
  hasJobTitle: "職種の入力",
  hasWorkExperience: "職務経歴の登録",
  hasLanguage: "言語情報の登録",
};

/** Drives ProfileCompletion off real signals only -- no fabricated percentage. */
export function computeProfileCompletion(
  input: ProfileCompletionInput,
): ProfileCompletionResult {
  const keys = Object.keys(COMPLETION_ITEM_LABELS) as (keyof ProfileCompletionInput)[];
  const filled = keys.filter((key) => input[key]).length;
  const missingItems = keys.filter((key) => !input[key]).map((key) => COMPLETION_ITEM_LABELS[key]);

  return {
    percentage: Math.round((filled / keys.length) * 100),
    missingItems,
  };
}
