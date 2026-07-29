import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { hydrateOpportunities, type HydratedOpportunity } from "@/lib/engineer/opportunities";

interface FeaturedCandidateRow {
  id: string;
  title: string;
  description?: string;
  contract_type: string;
  created_at: string;
  updated_at: string;
  posted_by: string;
}

// Wide enough to survive the active-company and one-per-company filters
// while still leaving room for a contract-type mix, at the site's current
// data volume.
const CANDIDATE_POOL_SIZE = 60;

/**
 * Resolves which of the given company owner ids are ACTIVE. Uses the
 * service-role client because RLS on public.users has no anon/engineer-
 * readable path to another company's status -- this is a narrow status-only
 * lookup, never used to broaden which opportunity *rows* are visible (that
 * query still runs on the caller's own session below).
 */
async function resolveActiveCompanyIds(ownerIds: string[]): Promise<Set<string>> {
  const uniqueIds = [...new Set(ownerIds)];
  if (uniqueIds.length === 0) return new Set();

  const admin = createAdminClient();
  if (!admin) {
    console.error(
      "[landing] SUPABASE_SERVICE_ROLE_KEY not configured; cannot resolve active companies for featured opportunities",
    );
    return new Set();
  }

  const { data, error } = await admin
    .from("users")
    .select("id")
    .in("id", uniqueIds)
    .eq("status", "ACTIVE");

  if (error) {
    console.error("[landing] failed to resolve active companies:", error);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.id as string));
}

/**
 * Picks up to `limit` rows from a newest-first, already one-per-company list:
 * first the newest row of each distinct contract type (so the grid doesn't
 * end up all one type when several are available), then fills any remaining
 * slots by recency. Re-sorted by recency afterward so display order still
 * reads newest-first.
 */
function pickContractTypeMix(rows: FeaturedCandidateRow[], limit: number): FeaturedCandidateRow[] {
  const remaining = [...rows];
  const selected: FeaturedCandidateRow[] = [];
  const seenTypes = new Set<string>();

  for (let index = 0; index < remaining.length && selected.length < limit; ) {
    const row = remaining[index];
    if (!seenTypes.has(row.contract_type)) {
      seenTypes.add(row.contract_type);
      selected.push(row);
      remaining.splice(index, 1);
    } else {
      index++;
    }
  }

  for (const row of remaining) {
    if (selected.length >= limit) break;
    selected.push(row);
  }

  selected.sort((a, b) => {
    const order = b.updated_at.localeCompare(a.updated_at);
    return order !== 0 ? order : b.id.localeCompare(a.id);
  });

  return selected;
}

/**
 * Landing page "featured opportunities": published, ACTIVE-company only, at
 * most one per company, newest/recently-updated priority with a reasonable
 * contract-type mix, capped at `limit`. Deliberately separate from
 * listPublishedOpportunities (src/lib/engineer/opportunities.ts) -- the real
 * Engineer search/list page must keep its existing behavior unchanged.
 *
 * Runs the opportunity read on the caller's own session, so RLS
 * (opportunities_select_active, authenticated-only) still applies exactly as
 * before: an anonymous visitor legitimately gets zero rows here, same as the
 * rest of the site.
 */
export async function listFeaturedOpportunities(
  supabase: SupabaseClient,
  limit = 6,
): Promise<HydratedOpportunity[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, title, description, contract_type, created_at, updated_at, posted_by")
    .eq("status", "published")
    .eq("unpublished_by_admin", false)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(CANDIDATE_POOL_SIZE);

  if (error) {
    console.error("[landing] failed to list featured opportunity candidates:", error);
    return [];
  }

  const rows = (data ?? []) as FeaturedCandidateRow[];
  if (rows.length === 0) return [];

  const activeCompanyIds = await resolveActiveCompanyIds(rows.map((row) => row.posted_by));
  const fromActiveCompanies = rows.filter((row) => activeCompanyIds.has(row.posted_by));

  const seenCompanies = new Set<string>();
  const onePerCompany: FeaturedCandidateRow[] = [];
  for (const row of fromActiveCompanies) {
    if (seenCompanies.has(row.posted_by)) continue;
    seenCompanies.add(row.posted_by);
    onePerCompany.push(row);
  }

  const selected = pickContractTypeMix(onePerCompany, limit);
  return hydrateOpportunities(supabase, selected);
}
