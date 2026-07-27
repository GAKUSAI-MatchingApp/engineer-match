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
  contract_type: CompanyContractType;
  created_at: string;
  updated_at: string;
  companyName: string;
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
  contract_type: string;
  created_at: string;
  updated_at: string;
  posted_by: string;
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
      supabase.from("company_profiles").select("id, company_name").in("id", postedByIds),
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
      supabase
        .from("opportunity_required_skills")
        .select("opportunity_id, skill_id")
        .in("opportunity_id", ids),
    ]);

  const companyNameById = new Map(
    (companiesRes.data ?? []).map((row) => [row.id as string, row.company_name as string]),
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

  const skillLinks = skillLinksRes.data ?? [];
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
      contract_type: row.contract_type as CompanyContractType,
      created_at: row.created_at,
      updated_at: row.updated_at,
      companyName: companyNameById.get(row.posted_by) || "",
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
  /** BR-39: only ever constrains contract_type='employment' rows — other contract types are never excluded by this. */
  workStyle?: WorkStyleValue | null;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}

export interface ListOpportunitiesResult {
  items: HydratedOpportunity[];
  total: number;
  page: number;
  pageSize: number;
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
  const { data, error } = await supabase
    .from("opportunity_required_skills")
    .select("opportunity_id, skill_id")
    .in("skill_id", skillIds);

  if (error) {
    console.error("[engineer-jobs] failed to resolve skill filter:", error);
    return [];
  }

  const matchedSkillsByOpp = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const oppId = row.opportunity_id as string;
    const set = matchedSkillsByOpp.get(oppId) ?? new Set<string>();
    set.add(row.skill_id as string);
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
  const [employmentResult, hourlyResult] = await Promise.all([
    supabase
      .from("opportunity_employment")
      .select("opportunity_id")
      .eq("work_style", workStyle),
    supabase
      .from("opportunity_hourly")
      .select("opportunity_id")
      .eq("work_style", workStyle),
  ]);

  if (employmentResult.error || hourlyResult.error) {
    console.error(
      "[engineer-jobs] failed to resolve work style filter:",
      employmentResult.error ?? hourlyResult.error,
    );
    return [];
  }

  return [
    ...new Set(
      [...(employmentResult.data ?? []), ...(hourlyResult.data ?? [])].map(
        (row) => row.opportunity_id as string,
      ),
    ),
  ];
}

/** Published, non-admin-unpublished, non-deleted opportunities — matches opportunities_select_active RLS. */
export async function listPublishedOpportunities(
  supabase: SupabaseClient,
  options: ListOpportunitiesOptions = {},
): Promise<ListOpportunitiesResult> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize ?? 20;

  const skillIds = (options.skillIds ?? []).filter(Boolean);
  let skillFilterIds: string[] | null = null;
  if (skillIds.length > 0) {
    skillFilterIds = await resolveSkillAndFilterIds(supabase, skillIds);
    if (skillFilterIds.length === 0) {
      return { items: [], total: 0, page, pageSize, error: false };
    }
  }

  let workStyleMatchIds: string[] | null = null;
  if (options.workStyle) {
    workStyleMatchIds = await resolveWorkStyleMatchIds(supabase, options.workStyle);
    if (workStyleMatchIds.length === 0) {
      return { items: [], total: 0, page, pageSize, error: false };
    }
  }

  let query = supabase
    .from("opportunities")
    .select("id, title, contract_type, created_at, updated_at, posted_by", {
      count: "exact",
    })
    .eq("status", "published")
    .eq("unpublished_by_admin", false)
    .is("deleted_at", null);

  if (skillFilterIds) {
    query = query.in("id", skillFilterIds);
  }

  if (workStyleMatchIds) {
    query = query.in("id", workStyleMatchIds);
  }

  const search = options.search?.trim();
  if (search) {
    // PostgREST's or=(...) filter mini-language treats backslash/comma/
    // parentheses as syntax, not literal text -- escape them here so a
    // keyword containing e.g. "," or ")" can't split or malform the filter
    // expression. This is PostgREST-string escaping, unrelated to (and not a
    // substitute for) parameterized SQL, which the query builder still
    // handles for us.
    const escaped = search.replace(/\\/g, "\\\\").replace(/[,()]/g, (char) => `\\${char}`);
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }
  if (options.contractType) {
    query = query.eq("contract_type", options.contractType);
  }

  query = query
    .order("updated_at", { ascending: options.sort === "oldest" })
    .order("id", { ascending: options.sort === "oldest" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[engineer-jobs] failed to list published opportunities:", error);
    return { items: [], total: 0, page, pageSize, error: true };
  }

  const items = await hydrateOpportunities(supabase, data ?? []);
  return { items, total: count ?? 0, page, pageSize, error: false };
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
