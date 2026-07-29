import type { SupabaseClient } from "@supabase/supabase-js";
import { getCompanyProfile } from "@/lib/company/profile";

/**
 * public.opportunities shape, per 005_opportunities.sql. Engineer-facing
 * reads only ever see side='ENGINEER' rows (contract_type in
 * employment/project/hourly) — 'training' is the TRAINING side, out of
 * scope here.
 */
export interface Opportunity {
  id: string;
  side: "ENGINEER" | "TRAINING";
  contract_type: "employment" | "project" | "hourly" | "training";
  title: string;
  description: string;
  status: "draft" | "published" | "closed";
  posted_by: string;
  unpublished_by_admin: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type CompanyContractType = "employment" | "project" | "hourly";

/** 006_opportunity_employment.sql */
export interface OpportunityEmployment {
  opportunity_id: string;
  work_style: "REMOTE" | "ONSITE" | "HYBRID";
  salary_min: number;
  salary_max: number;
}

/** 007_opportunity_project.sql */
export interface OpportunityProject {
  opportunity_id: string;
  deadline: string;
  budget: number;
  headcount: number;
  is_online: boolean;
}

/**
 * 008_opportunity_hourly.sql, plus work_style added by
 * 063_opportunity_hourly_work_style.sql (Phase 5 決定事項②). NULL on rows
 * that predate that migration -- never back-derived from is_online, which
 * has no safe one-to-one mapping to REMOTE/ONSITE/HYBRID.
 */
export interface OpportunityHourly {
  opportunity_id: string;
  period_start: string;
  period_end: string;
  time_start: string;
  time_end: string;
  hourly_rate: number;
  is_online: boolean;
  work_style: "REMOTE" | "ONSITE" | "HYBRID" | null;
  headcount: number;
}

/** Flat row shape shared by the list and favorites views (public.skills-resolved). */
export interface HydratedOpportunity {
  id: string;
  title: string;
  description: string;
  contract_type: CompanyContractType;
  created_at: string;
  updated_at: string;
  companyName: string;
  companyPrefecture: string | null;
  workStyle: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  budget: number | null;
  hourlyRate: number | null;
  requiredSkillNames: string[];
}

interface HydrationSourceRow {
  id: string;
  title: string;
  description?: string;
  contract_type: string;
  created_at: string;
  updated_at: string;
  posted_by: string;
}

const POSTGREST_FETCH_BATCH_SIZE = 500;
const OPPORTUNITY_ID_FILTER_BATCH_SIZE = 100;
const HYDRATION_BATCH_SIZE = 100;

async function listRequiredSkillLinks(
  supabase: SupabaseClient,
  opportunityIds: string[],
): Promise<{ opportunity_id: string; skill_id: string }[]> {
  const links: { opportunity_id: string; skill_id: string }[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("opportunity_required_skills")
      .select("opportunity_id, skill_id")
      .in("opportunity_id", opportunityIds)
      .order("opportunity_id")
      .order("skill_id")
      .range(offset, offset + POSTGREST_FETCH_BATCH_SIZE - 1);

    if (error) {
      console.error("[engineer-jobs] failed to hydrate required skills:", error);
      return [];
    }

    const batch = (data ?? []) as { opportunity_id: string; skill_id: string }[];
    links.push(...batch);
    if (batch.length < POSTGREST_FETCH_BATCH_SIZE) break;
    offset += batch.length;
  }

  return links;
}

/**
 * Batch-resolves company name, contract-type sub-table fields, and required
 * skill names for a set of opportunity rows in a small, fixed number of
 * queries (not one round-trip per row) — used by both the published job
 * list and the favorites list.
 */
export async function hydrateOpportunities(
  supabase: SupabaseClient,
  rows: HydrationSourceRow[],
): Promise<HydratedOpportunity[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const postedByIds = [...new Set(rows.map((row) => row.posted_by))];

  const [companiesRes, employmentRes, projectRes, hourlyRes, skillLinksRes] =
    await Promise.all([
      supabase
        .from("company_profiles")
        .select("id, company_name, prefecture")
        .in("id", postedByIds),
      supabase
        .from("opportunity_employment")
        .select("opportunity_id, work_style, salary_min, salary_max")
        .in("opportunity_id", ids),
      supabase
        .from("opportunity_project")
        .select("opportunity_id, budget")
        .in("opportunity_id", ids),
      supabase
        .from("opportunity_hourly")
        .select("opportunity_id, hourly_rate, work_style")
        .in("opportunity_id", ids),
      listRequiredSkillLinks(supabase, ids),
    ]);

  const companyById = new Map(
    (companiesRes.data ?? []).map((row) => [
      row.id as string,
      {
        name: row.company_name as string,
        prefecture: (row.prefecture as string | null) ?? null,
      },
    ]),
  );
  const employmentByOpp = new Map(
    (employmentRes.data ?? []).map((row) => [row.opportunity_id as string, row]),
  );
  const projectByOpp = new Map(
    (projectRes.data ?? []).map((row) => [row.opportunity_id as string, row]),
  );
  const hourlyByOpp = new Map(
    (hourlyRes.data ?? []).map((row) => [row.opportunity_id as string, row]),
  );

  const skillLinks = skillLinksRes;
  const skillIds = [...new Set(skillLinks.map((row) => row.skill_id as string))];
  let skillNameById = new Map<string, string>();
  if (skillIds.length > 0) {
    const { data: skillRows } = await supabase
      .from("skills")
      .select("id, name")
      .in("id", skillIds);
    skillNameById = new Map((skillRows ?? []).map((row) => [row.id as string, row.name as string]));
  }
  const skillNamesByOpp = new Map<string, string[]>();
  for (const link of skillLinks) {
    const name = skillNameById.get(link.skill_id as string);
    if (!name) continue;
    const oppId = link.opportunity_id as string;
    const list = skillNamesByOpp.get(oppId) ?? [];
    list.push(name);
    skillNamesByOpp.set(oppId, list);
  }

  return rows.map((row) => {
    const employment = employmentByOpp.get(row.id);
    const project = projectByOpp.get(row.id);
    const hourly = hourlyByOpp.get(row.id);

    return {
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      contract_type: row.contract_type as CompanyContractType,
      created_at: row.created_at,
      updated_at: row.updated_at,
      companyName: companyById.get(row.posted_by)?.name || "",
      companyPrefecture: companyById.get(row.posted_by)?.prefecture ?? null,
      // Phase 5 決定事項②: hourly gained its own work_style column
      // (063_opportunity_hourly_work_style.sql); employment keeps priority
      // since only one of the two can ever be set for a given opportunity
      // (contract_type is exclusive), null-coalescing is purely defensive.
      workStyle: employment
        ? (employment.work_style as string)
        : hourly?.work_style
          ? (hourly.work_style as string)
          : null,
      salaryMin: employment ? (employment.salary_min as number) : null,
      salaryMax: employment ? (employment.salary_max as number) : null,
      budget: project ? (project.budget as number) : null,
      hourlyRate: hourly ? (hourly.hourly_rate as number) : null,
      requiredSkillNames: skillNamesByOpp.get(row.id) ?? [],
    };
  });
}

export type WorkStyleValue = "REMOTE" | "ONSITE" | "HYBRID";

export interface ListOpportunitiesOptions {
  search?: string;
  contractType?: CompanyContractType | null;
  /** BR-37: opportunities must have ALL of these as required skills (AND, not OR). */
  skillIds?: string[];
  /** BR-39: constrains the employment/hourly subtype tables that own work_style. */
  workStyle?: WorkStyleValue | null;
  sort?: "newest" | "oldest";
  /** Optional bounded preview size for callers such as the dashboard. Omit to fetch all matches. */
  limit?: number;
}

export interface ListOpportunitiesResult {
  items: HydratedOpportunity[];
  total: number;
  error: boolean;
}

/**
 * Resolves the AND-semantics skill filter (BR-37) to a concrete list of
 * qualifying opportunity ids, or null if no skill filter is active.
 *
 * A single `skill_id IN (...)` query on opportunity_required_skills only
 * expresses OR ("has at least one of these skills") — AND ("has every one
 * of these skills") requires grouping the matched rows by opportunity_id and
 * keeping only the ones whose distinct matched-skill count equals the
 * selected-skill count (equivalent to `GROUP BY opportunity_id HAVING
 * COUNT(DISTINCT skill_id) = selectedCount`, done client-side since this
 * project has no RPC/view for it). RLS (opportunity_required_skills_select_
 * via_opportunity, 024_opportunity_policies.sql) is unchanged and still
 * applies to this read.
 */
async function resolveSkillAndFilterIds(
  supabase: SupabaseClient,
  skillIds: string[],
): Promise<string[]> {
  const rows: { opportunity_id: string; skill_id: string }[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("opportunity_required_skills")
      .select("opportunity_id, skill_id")
      .in("skill_id", skillIds)
      .order("opportunity_id")
      .order("skill_id")
      .range(offset, offset + POSTGREST_FETCH_BATCH_SIZE - 1);

    if (error) {
      console.error("[engineer-jobs] failed to resolve skill filter:", error);
      return [];
    }

    const batch = (data ?? []) as { opportunity_id: string; skill_id: string }[];
    rows.push(...batch);
    if (batch.length < POSTGREST_FETCH_BATCH_SIZE) break;
    offset += batch.length;
  }

  const matchedSkillsByOpp = new Map<string, Set<string>>();
  for (const row of rows) {
    const oppId = row.opportunity_id;
    const set = matchedSkillsByOpp.get(oppId) ?? new Set<string>();
    set.add(row.skill_id);
    matchedSkillsByOpp.set(oppId, set);
  }

  return [...matchedSkillsByOpp.entries()]
    .filter(([, matched]) => matched.size === skillIds.length)
    .map(([oppId]) => oppId);
}

/** Resolves work style across every subtype that owns the canonical field. */
async function resolveWorkStyleMatchIds(
  supabase: SupabaseClient,
  workStyle: WorkStyleValue,
): Promise<string[]> {
  async function fetchSubtypeIds(
    table: "opportunity_employment" | "opportunity_hourly",
  ): Promise<string[] | null> {
    const ids: string[] = [];
    let offset = 0;

    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select("opportunity_id")
        .eq("work_style", workStyle)
        .order("opportunity_id")
        .range(offset, offset + POSTGREST_FETCH_BATCH_SIZE - 1);

      if (error) {
        console.error("[engineer-jobs] failed to resolve work style filter:", error);
        return null;
      }

      const batch = (data ?? []).map((row) => row.opportunity_id as string);
      ids.push(...batch);
      if (batch.length < POSTGREST_FETCH_BATCH_SIZE) break;
      offset += batch.length;
    }

    return ids;
  }

  const [employmentIds, hourlyIds] = await Promise.all([
    fetchSubtypeIds("opportunity_employment"),
    fetchSubtypeIds("opportunity_hourly"),
  ]);

  if (!employmentIds || !hourlyIds) return [];
  return [...new Set([...employmentIds, ...hourlyIds])];
}

/** Published, non-admin-unpublished, non-deleted opportunities — matches opportunities_select_active RLS. */
export async function listPublishedOpportunities(
  supabase: SupabaseClient,
  options: ListOpportunitiesOptions = {},
): Promise<ListOpportunitiesResult> {
  const skillIds = (options.skillIds ?? []).filter(Boolean);
  let candidateIds: string[] | null = null;
  if (skillIds.length > 0) {
    candidateIds = await resolveSkillAndFilterIds(supabase, skillIds);
    if (candidateIds.length === 0) {
      return { items: [], total: 0, error: false };
    }
  }

  if (options.workStyle) {
    const workStyleMatchIds = await resolveWorkStyleMatchIds(supabase, options.workStyle);
    if (workStyleMatchIds.length === 0) {
      return { items: [], total: 0, error: false };
    }
    const workStyleSet = new Set(workStyleMatchIds);
    candidateIds = candidateIds
      ? candidateIds.filter((id) => workStyleSet.has(id))
      : workStyleMatchIds;
    if (candidateIds.length === 0) return { items: [], total: 0, error: false };
  }

  const search = options.search?.trim();
  const escapedSearch = search
    ? search.replace(/\\/g, "\\\\").replace(/[,()]/g, (char) => `\\${char}`)
    : null;
  const ascending = options.sort === "oldest";

  function createQuery(idBatch: string[] | null, includeCount: boolean) {
    let query = supabase
      .from("opportunities")
      .select("id, title, description, contract_type, created_at, updated_at, posted_by", {
        count: includeCount ? "exact" : undefined,
      })
      .eq("status", "published")
      .eq("unpublished_by_admin", false)
      .is("deleted_at", null);

    if (idBatch) query = query.in("id", idBatch);
    if (escapedSearch) {
      // PostgREST's or=(...) mini-language treats these characters as syntax.
      query = query.or(
        `title.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`,
      );
    }
    if (options.contractType) {
      query = query.eq("contract_type", options.contractType);
    }

    return query
      .order("updated_at", { ascending })
      .order("id", { ascending });
  }

  const rows: HydrationSourceRow[] = [];
  let total = 0;

  if (candidateIds) {
    for (let index = 0; index < candidateIds.length; index += OPPORTUNITY_ID_FILTER_BATCH_SIZE) {
      const idBatch = candidateIds.slice(index, index + OPPORTUNITY_ID_FILTER_BATCH_SIZE);
      const { data, error } = await createQuery(idBatch, false);
      if (error) {
        console.error("[engineer-jobs] failed to list published opportunities:", error);
        return { items: [], total: 0, error: true };
      }
      rows.push(...((data ?? []) as HydrationSourceRow[]));
    }

    rows.sort((left, right) => {
      const dateOrder = left.updated_at.localeCompare(right.updated_at);
      if (dateOrder !== 0) return ascending ? dateOrder : -dateOrder;
      const idOrder = left.id.localeCompare(right.id);
      return ascending ? idOrder : -idOrder;
    });
    total = rows.length;
  } else {
    const requestedLimit =
      options.limit && options.limit > 0 ? Math.floor(options.limit) : Number.POSITIVE_INFINITY;
    let offset = 0;
    let isFirstBatch = true;
    let knownTotal: number | null = null;

    while (rows.length < requestedLimit) {
      const batchSize = Math.min(
        POSTGREST_FETCH_BATCH_SIZE,
        Number.isFinite(requestedLimit) ? requestedLimit - rows.length : POSTGREST_FETCH_BATCH_SIZE,
      );
      const { data, error, count } = await createQuery(null, isFirstBatch).range(
        offset,
        offset + batchSize - 1,
      );

      if (error) {
        console.error("[engineer-jobs] failed to list published opportunities:", error);
        return { items: [], total: 0, error: true };
      }

      const batch = (data ?? []) as HydrationSourceRow[];
      rows.push(...batch);
      if (isFirstBatch) knownTotal = count;
      if (batch.length < batchSize || (knownTotal !== null && rows.length >= knownTotal)) break;

      offset += batch.length;
      isFirstBatch = false;
    }
    total = knownTotal ?? rows.length;
  }

  const visibleRows =
    options.limit && options.limit > 0 ? rows.slice(0, Math.floor(options.limit)) : rows;
  const items: HydratedOpportunity[] = [];
  for (let index = 0; index < visibleRows.length; index += HYDRATION_BATCH_SIZE) {
    // Fixed-size hydration batches avoid N+1 reads and oversized PostgREST `in` URLs.
    items.push(
      ...(await hydrateOpportunities(
        supabase,
        visibleRows.slice(index, index + HYDRATION_BATCH_SIZE),
      )),
    );
  }

  return { items, total, error: false };
}

export interface EngineerJobDetail {
  opportunity: Opportunity;
  employment: OpportunityEmployment | null;
  project: OpportunityProject | null;
  hourly: OpportunityHourly | null;
  company: Awaited<ReturnType<typeof getCompanyProfile>>;
  requiredSkillNames: string[];
}

/** A single published opportunity with full detail — company + subtype + required skills. */
export async function getPublishedOpportunity(
  supabase: SupabaseClient,
  id: string,
): Promise<EngineerJobDetail | null> {
  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .eq("unpublished_by_admin", false)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[engineer-jobs] failed to load opportunity:", error);
    return null;
  }
  if (!opportunity) return null;

  let employment: OpportunityEmployment | null = null;
  let project: OpportunityProject | null = null;
  let hourly: OpportunityHourly | null = null;

  if (opportunity.contract_type === "employment") {
    const { data } = await supabase
      .from("opportunity_employment")
      .select("*")
      .eq("opportunity_id", id)
      .maybeSingle();
    employment = data as OpportunityEmployment | null;
  } else if (opportunity.contract_type === "project") {
    const { data } = await supabase
      .from("opportunity_project")
      .select("*")
      .eq("opportunity_id", id)
      .maybeSingle();
    project = data as OpportunityProject | null;
  } else if (opportunity.contract_type === "hourly") {
    const { data } = await supabase
      .from("opportunity_hourly")
      .select("*")
      .eq("opportunity_id", id)
      .maybeSingle();
    hourly = data as OpportunityHourly | null;
  }

  const company = await getCompanyProfile(supabase, opportunity.posted_by);

  const { data: skillLinks } = await supabase
    .from("opportunity_required_skills")
    .select("skill_id")
    .eq("opportunity_id", id);
  const skillIds = (skillLinks ?? []).map((row) => row.skill_id as string);

  let requiredSkillNames: string[] = [];
  if (skillIds.length > 0) {
    const { data: skillRows } = await supabase
      .from("skills")
      .select("name")
      .in("id", skillIds);
    requiredSkillNames = (skillRows ?? []).map((row) => row.name as string);
  }

  return {
    opportunity: opportunity as Opportunity,
    employment,
    project,
    hourly,
    company,
    requiredSkillNames,
  };
}
