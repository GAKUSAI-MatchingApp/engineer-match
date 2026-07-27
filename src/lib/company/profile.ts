import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * public.company_profiles shape, per 004_profile_tables.sql. Hand-written
 * (no Supabase codegen has been run for this project). `id` is both the
 * primary key and the FK to public.users(id) — one row per company account.
 */
export interface CompanyProfile {
  id: string;
  company_name: string;
  logo_url: string | null;
  prefecture: string | null;
  address: string | null;
  business_description: string | null;
  website_url: string | null;
  contact_person: string | null;
  company_size: string | null;
  /**
   * Legacy free-text industry (004_profile_tables.sql). Phase 5 決定事項③
   * moves the edit UI to master selection (industry_category_id below), but
   * this column is deliberately kept and never cleared/overwritten by the
   * new form -- existing values (including ones with no clean mapping to
   * any master category) are preserved as-is.
   */
  industry: string | null;
  /** public.industry_categories FK, per 064_industry_categories.sql draft. NULL for every row until a company explicitly picks one via the new selector. */
  industry_category_id: string | null;
  established_year: number | null;
  created_at: string;
  updated_at: string;
}

/** public.industry_categories, per 064_industry_categories.sql draft (Phase 5 決定事項③). */
export interface IndustryCategoryOption {
  id: string;
  name: string;
}

/** Active industries only, for the Company Profile edit selector -- mirrors listSkillCatalog()'s is_active filtering (src/lib/engineer/skills.ts). */
export async function listActiveIndustryCategories(
  supabase: SupabaseClient,
): Promise<IndustryCategoryOption[]> {
  const { data, error } = await supabase
    .from("industry_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    console.error("[company-profile] failed to list industry categories:", error);
    return [];
  }

  return (data ?? []) as IndustryCategoryOption[];
}

export type CompanyProfileInput = Omit<
  CompanyProfile,
  "id" | "created_at" | "updated_at"
>;

/**
 * A freshly-signed-up COMPANY account has no company_profiles row yet — no
 * trigger creates one at signup (handle_new_user only inserts into
 * public.users). .maybeSingle() returns null for that case instead of
 * throwing, mirroring getUserAccount()'s pattern in src/lib/auth/account.ts.
 */
export async function getCompanyProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<CompanyProfile | null> {
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[company] failed to load company_profiles row:", error);
    return null;
  }

  return data as CompanyProfile | null;
}

/**
 * Upserts the caller's own company_profiles row. Works for both first-time
 * create (no existing row) and subsequent updates — RLS enforces
 * id = auth.uid() and role = 'COMPANY' on both the insert and update paths
 * (company_profiles_insert_own / company_profiles_update_own in
 * 023_profile_policies.sql), so this never needs a service-role client.
 */
/**
 * RD 4.3.6: established_year may never be later than the current year, on
 * top of the existing chk_company_profiles_established_year DB CHECK
 * (1800-2100, 004_profile_tables.sql) which this doesn't replace or relax.
 * Re-checked here so a caller bypassing CompanyProfileHeader's own form
 * validation still can't save a future year.
 */
export async function saveCompanyProfile(
  supabase: SupabaseClient,
  userId: string,
  input: CompanyProfileInput,
) {
  if (input.established_year !== null && input.established_year > new Date().getFullYear()) {
    return {
      data: null,
      error: { message: "established_year cannot be later than the current year" },
    };
  }

  return supabase
    .from("company_profiles")
    .upsert({ id: userId, ...input }, { onConflict: "id" })
    .select("*")
    .single();
}

export interface CompanyHeaderIdentity {
  name: string;
  email: string;
  initials: string;
}

const COMPANY_HEADER_FALLBACK_NAME = "企業アカウント";

/**
 * Real display identity for the shared UserMenu header -- replaces the old
 * hardcoded USER_MENU.company placeholder, mirroring
 * getEngineerHeaderIdentity() in src/lib/engineer/profile.ts. Prefers the
 * company_profiles.company_name (the name the company itself set), falling
 * back to public.users.name (populated from signup metadata, present even
 * before a company_profiles row exists) and finally to a generic account
 * label -- never a name that could be mistaken for a real company.
 */
export async function getCompanyHeaderIdentity(
  supabase: SupabaseClient,
  authUser: { id: string; email?: string | null } | null,
): Promise<CompanyHeaderIdentity> {
  if (!authUser) {
    return { name: COMPANY_HEADER_FALLBACK_NAME, email: "", initials: "?" };
  }

  const [{ data: userRow }, { data: profileRow }] = await Promise.all([
    supabase.from("users").select("name, email").eq("id", authUser.id).maybeSingle(),
    supabase.from("company_profiles").select("company_name").eq("id", authUser.id).maybeSingle(),
  ]);

  const name =
    (profileRow?.company_name as string | undefined)?.trim() ||
    (userRow?.name as string | undefined)?.trim() ||
    COMPANY_HEADER_FALLBACK_NAME;
  const email = (userRow?.email as string | undefined) ?? authUser.email ?? "";

  return { name, email, initials: name.charAt(0) || "?" };
}
