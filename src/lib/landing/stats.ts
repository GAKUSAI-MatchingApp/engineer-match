import { createAdminClient } from "@/lib/supabase/admin";

export interface LandingStats {
  activeEngineerCount: number;
  publishedOpportunityCount: number;
  activeCompanyCount: number;
  activeSkillCount: number;
}

/**
 * Real, live counts for the landing page stats banner. Uses the service-role
 * client (see src/lib/supabase/admin.ts) because RLS has no anon-readable
 * path to public.users.status, which most visitors to this page are --
 * without it, every count here would read as 0 for anyone not logged in.
 *
 * Returns null (never a fabricated number) if the service-role key isn't
 * configured or any query fails -- callers must hide the section rather than
 * show a placeholder.
 */
export async function getLandingStats(): Promise<LandingStats | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.error("[landing] SUPABASE_SERVICE_ROLE_KEY not configured; skipping live stats");
    return null;
  }

  const [engineers, opportunities, companies, skills] = await Promise.all([
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "ENGINEER")
      .eq("status", "ACTIVE"),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("unpublished_by_admin", false)
      .is("deleted_at", null),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "COMPANY")
      .eq("status", "ACTIVE"),
    supabase.from("skills").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const firstError =
    engineers.error ?? opportunities.error ?? companies.error ?? skills.error;
  if (firstError) {
    console.error("[landing] failed to load live stats:", firstError);
    return null;
  }

  return {
    activeEngineerCount: engineers.count ?? 0,
    publishedOpportunityCount: opportunities.count ?? 0,
    activeCompanyCount: companies.count ?? 0,
    activeSkillCount: skills.count ?? 0,
  };
}
