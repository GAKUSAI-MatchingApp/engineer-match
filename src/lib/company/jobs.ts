import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * public.opportunities shape, per 005_opportunities.sql. COMPANY-posted job
 * postings are always side='ENGINEER' with contract_type in
 * ('employment','project','hourly') — 'training' is the TRAINING side, not
 * used by the company job-posting flow.
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
export type JobStatus = Opportunity["status"];

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
  is_online: boolean | null;
}

/**
 * 008_opportunity_hourly.sql, plus work_style added by
 * 063_opportunity_hourly_work_style.sql (Phase 5 決定事項②). work_style is
 * nullable: existing rows created before that migration have no safe,
 * non-guessed mapping from is_online and are left NULL (legacy). is_online
 * itself is unchanged and kept for backward compatibility -- never read as
 * a proxy for work_style.
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

/** public.skills, per 003_master_tables.sql */
export interface Skill {
  id: string;
  name: string;
}

export interface OpportunityListItem {
  id: string;
  title: string;
  contract_type: Opportunity["contract_type"];
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface OpportunityDetail {
  opportunity: Opportunity;
  employment: OpportunityEmployment | null;
  project: OpportunityProject | null;
  hourly: OpportunityHourly | null;
  requiredSkillIds: string[];
}

export interface EmploymentInput {
  work_style: OpportunityEmployment["work_style"];
  salary_min: number;
  salary_max: number;
}

export interface ProjectInput {
  deadline: string;
  budget: number;
  headcount: number;
  /**
   * The live DB enforces opportunity_project.is_online NOT NULL — contrary
   * to 007_opportunity_project.sql's `is_online BOOLEAN` (no NOT NULL). This
   * write-side type follows the real live constraint; the UI (CreateJobForm)
   * always sends true/false, never null.
   */
  is_online: boolean;
}

export interface HourlyInput {
  period_start: string;
  period_end: string;
  time_start: string;
  time_end: string;
  hourly_rate: number;
  is_online: boolean;
  /** Required for every new create/edit save going forward (RD 決定事項②); only ever NULL on rows that predate 063_opportunity_hourly_work_style.sql. */
  work_style: "REMOTE" | "ONSITE" | "HYBRID";
  headcount: number;
}

export interface OpportunityInput {
  title: string;
  description: string;
  contract_type: CompanyContractType;
  status: JobStatus;
  employment: EmploymentInput | null;
  project: ProjectInput | null;
  hourly: HourlyInput | null;
  requiredSkillIds: string[];
}

/** Own postings, any status — list/detail pages need to see drafts too, unlike public browse. */
export async function listCompanyOpportunities(
  supabase: SupabaseClient,
  userId: string,
): Promise<OpportunityListItem[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, title, contract_type, status, created_at, updated_at")
    .eq("posted_by", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[company-jobs] failed to list opportunities:", error);
    return [];
  }

  return (data ?? []) as OpportunityListItem[];
}

/**
 * Count of the caller's own published opportunities, for the withdrawal
 * guard (BR-116 / RD-2026-001 4.11). This is a UX pre-check only -- the
 * withdraw_own_account() RPC (062_self_service_account_withdrawal.sql
 * draft) re-checks the exact same condition server-side before allowing
 * ACTIVE -> WITHDRAWN, so a stale or bypassed client-side read here can
 * never actually let a published-opportunity company withdraw.
 */
export async function countPublishedOpportunities(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("posted_by", userId)
    .eq("status", "published")
    .is("deleted_at", null);

  if (error) {
    console.error("[company-jobs] failed to count published opportunities:", error);
    return 0;
  }

  return count ?? 0;
}

/** Active, non-deprecated skills for the required-skills picker. */
export async function listSkills(supabase: SupabaseClient): Promise<Skill[]> {
  const { data, error } = await supabase
    .from("skills")
    .select("id, name")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    console.error("[company-jobs] failed to list skills:", error);
    return [];
  }

  return (data ?? []) as Skill[];
}

/**
 * Fetches one opportunity scoped to its owning company. Returns null for
 * both "doesn't exist" and "exists but belongs to someone else" — the
 * explicit .eq("posted_by", userId) plus RLS both enforce this, and
 * collapsing them into one response avoids leaking which case occurred.
 */
export async function getCompanyOpportunity(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<OpportunityDetail | null> {
  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("posted_by", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[company-jobs] failed to load opportunity:", error);
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

  const { data: skillRows } = await supabase
    .from("opportunity_required_skills")
    .select("skill_id")
    .eq("opportunity_id", id);

  return {
    opportunity: opportunity as Opportunity,
    employment,
    project,
    hourly,
    requiredSkillIds: (skillRows ?? []).map((row) => row.skill_id as string),
  };
}

/**
 * RD-2026-001 BR-23/BR-27: an opportunity may never reach status='published'
 * while its owning company has no registered company_name (NULL, empty, or
 * whitespace-only all count as unregistered). Draft saves are unaffected —
 * this is only ever checked when the target status is 'published'.
 */
async function hasRegisteredCompanyName(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("id", userId)
    .maybeSingle();
  const name = (data?.company_name as string | null | undefined) ?? "";
  return name.trim().length > 0;
}

/**
 * Today's date as YYYY-MM-DD in Asia/Tokyo -- matches opportunity_project.
 * deadline's DATE-column string format exactly, so it can be compared with a
 * plain string comparison instead of parsing either side into a Date object
 * (which would risk a UTC/local timezone shift making "today" look like
 * yesterday or tomorrow, RD-2026-001 4.4.6 note on deadline validation).
 */
export function getTodayDateStringJST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

/** Fast client-side duplicate of the authoritative save RPC validation. */
function validateOpportunityInput(input: OpportunityInput): boolean {
  if (input.requiredSkillIds.length < 1 || input.requiredSkillIds.length > 10) return false;
  if (input.description.length > 3000) return false;
  if (input.contract_type === "project" && input.project) {
    if (input.project.deadline < getTodayDateStringJST()) return false;
  }
  return true;
}

type OpportunitySaveStage =
  | "invalid_input"
  | "company_name_required"
  | "opportunity"
  | null;

function getSubtypePayload(input: OpportunityInput): EmploymentInput | ProjectInput | HourlyInput | null {
  if (input.contract_type === "employment") return input.employment;
  if (input.contract_type === "project") return input.project;
  return input.hourly;
}

function classifyOpportunitySaveError(error: { code?: string; message?: string }): OpportunitySaveStage {
  const message = error.message?.toLowerCase() ?? "";
  if (message.includes("company_name_required") || message.includes("company name")) {
    return "company_name_required";
  }
  if (
    error.code === "22023" ||
    error.code === "22P02" ||
    error.code === "23502" ||
    error.code === "23503" ||
    error.code === "23514"
  ) {
    return "invalid_input";
  }
  return "opportunity";
}

async function saveCompanyOpportunity(
  supabase: SupabaseClient,
  opportunityId: string | null,
  input: OpportunityInput,
) {
  if (!validateOpportunityInput(input) || !getSubtypePayload(input)) {
    return { data: null, error: null, stage: "invalid_input" as OpportunitySaveStage };
  }

  const { data, error } = await supabase.rpc("save_company_opportunity", {
    p_opportunity_id: opportunityId,
    p_title: input.title,
    p_description: input.description,
    p_contract_type: input.contract_type,
    p_status: input.status,
    p_subtype: getSubtypePayload(input),
    p_required_skill_ids: input.requiredSkillIds,
  });

  if (error) {
    return {
      data: null,
      error,
      stage: classifyOpportunitySaveError(error) as OpportunitySaveStage,
    };
  }

  return {
    data: { id: data as string },
    error: null,
    stage: null as OpportunitySaveStage,
  };
}

/** Creates the parent, subtype and required skills in one database transaction. */
export async function createCompanyOpportunity(
  supabase: SupabaseClient,
  input: OpportunityInput,
) {
  return saveCompanyOpportunity(supabase, null, input);
}

/**
 * Atomically updates the owned parent, locked subtype and required skills.
 * The RPC derives ownership from auth.uid(); no owner id crosses this API.
 */
export async function updateCompanyOpportunity(
  supabase: SupabaseClient,
  id: string,
  input: OpportunityInput,
) {
  const result = await saveCompanyOpportunity(supabase, id, input);
  return { error: result.error, stage: result.stage };
}

/**
 * "Delete" a job posting. opportunities has no owner-DELETE RLS policy
 * (024_opportunity_policies.sql: only ADMIN can hard-delete), so this is the
 * only self-service removal action available to a COMPANY account — closing
 * recruitment via a status update, not a real DELETE.
 */
export async function setCompanyOpportunityStatus(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  status: JobStatus,
) {
  if (status === "published" && !(await hasRegisteredCompanyName(supabase, userId))) {
    return {
      data: null,
      error: { message: "求人を公開するには企業プロフィールに会社名を登録してください。" },
    };
  }

  return supabase
    .from("opportunities")
    .update({ status })
    .eq("id", id)
    .eq("posted_by", userId)
    .select("id, status")
    .single();
}
