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

/** 008_opportunity_hourly.sql */
export interface OpportunityHourly {
  opportunity_id: string;
  period_start: string;
  period_end: string;
  time_start: string;
  time_end: string;
  hourly_rate: number;
  is_online: boolean;
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

async function upsertChildRow(
  supabase: SupabaseClient,
  opportunityId: string,
  input: OpportunityInput,
) {
  if (input.contract_type === "employment" && input.employment) {
    return supabase
      .from("opportunity_employment")
      .upsert(
        { opportunity_id: opportunityId, ...input.employment },
        { onConflict: "opportunity_id" },
      );
  }
  if (input.contract_type === "project" && input.project) {
    return supabase
      .from("opportunity_project")
      .upsert(
        { opportunity_id: opportunityId, ...input.project },
        { onConflict: "opportunity_id" },
      );
  }
  if (input.contract_type === "hourly" && input.hourly) {
    return supabase
      .from("opportunity_hourly")
      .upsert(
        { opportunity_id: opportunityId, ...input.hourly },
        { onConflict: "opportunity_id" },
      );
  }
  throw new Error(`missing sub-table input for contract_type=${input.contract_type}`);
}

async function reconcileRequiredSkills(
  supabase: SupabaseClient,
  opportunityId: string,
  requiredSkillIds: string[],
) {
  const { data: existingRows, error: readError } = await supabase
    .from("opportunity_required_skills")
    .select("skill_id")
    .eq("opportunity_id", opportunityId);

  if (readError) return readError;

  const existingIds = new Set((existingRows ?? []).map((row) => row.skill_id as string));
  const nextIds = new Set(requiredSkillIds);
  const toDelete = [...existingIds].filter((skillId) => !nextIds.has(skillId));
  const toInsert = [...nextIds].filter((skillId) => !existingIds.has(skillId));

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("opportunity_required_skills")
      .delete()
      .eq("opportunity_id", opportunityId)
      .in("skill_id", toDelete);
    if (error) return error;
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("opportunity_required_skills").insert(
      toInsert.map((skillId) => ({ opportunity_id: opportunityId, skill_id: skillId })),
    );
    if (error) return error;
  }

  return null;
}

/**
 * Creates a new opportunity: parent row, then its contract-type sub-table
 * row, then required-skill links. supabase-js has no cross-table
 * transaction — if the sub-table insert fails after the parent succeeded,
 * this attempts a best-effort DELETE of the parent as cleanup. Note that
 * opportunities has NO owner-DELETE RLS policy (024_opportunity_policies.sql
 * — only ADMIN can delete), so as a COMPANY-role caller that delete is
 * always a harmless no-op (0 rows affected, not an error) rather than real
 * cleanup. The orphaned draft-status parent row is recoverable:
 * updateCompanyOpportunity() upserts the sub-table row rather than assuming
 * it exists, so re-saving via the edit screen completes it without creating
 * a duplicate posting.
 */
export async function createCompanyOpportunity(
  supabase: SupabaseClient,
  userId: string,
  input: OpportunityInput,
) {
  if (input.status === "published" && !(await hasRegisteredCompanyName(supabase, userId))) {
    return { data: null, error: null, stage: "company_name_required" as const };
  }

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .insert({
      side: "ENGINEER",
      contract_type: input.contract_type,
      title: input.title,
      description: input.description,
      status: input.status,
      posted_by: userId,
    })
    .select("id")
    .single();

  if (opportunityError || !opportunity) {
    return { data: null, error: opportunityError, stage: "opportunity" as const };
  }

  const { error: childError } = await upsertChildRow(supabase, opportunity.id, input);
  if (childError) {
    await supabase.from("opportunities").delete().eq("id", opportunity.id);
    return { data: null, error: childError, stage: "child" as const };
  }

  if (input.requiredSkillIds.length > 0) {
    const { error: skillError } = await supabase.from("opportunity_required_skills").insert(
      input.requiredSkillIds.map((skillId) => ({
        opportunity_id: opportunity.id,
        skill_id: skillId,
      })),
    );
    if (skillError) {
      return { data: { id: opportunity.id as string }, error: skillError, stage: "skills" as const };
    }
  }

  return { data: { id: opportunity.id as string }, error: null, stage: null };
}

/**
 * Updates an existing opportunity. contract_type is intentionally not
 * updatable here — the UI locks it during edit (see CreateJobForm.tsx) since
 * switching contract types would require migrating data between two
 * different sub-tables with incompatible columns, which this schema has no
 * safe path for.
 */
export async function updateCompanyOpportunity(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: OpportunityInput,
) {
  if (input.status === "published" && !(await hasRegisteredCompanyName(supabase, userId))) {
    return { error: null, stage: "company_name_required" as const };
  }

  const { error: opportunityError } = await supabase
    .from("opportunities")
    .update({
      title: input.title,
      description: input.description,
      status: input.status,
    })
    .eq("id", id)
    .eq("posted_by", userId);

  if (opportunityError) {
    return { error: opportunityError, stage: "opportunity" as const };
  }

  const { error: childError } = await upsertChildRow(supabase, id, input);
  if (childError) {
    return { error: childError, stage: "child" as const };
  }

  const skillError = await reconcileRequiredSkills(supabase, id, input.requiredSkillIds);
  if (skillError) {
    return { error: skillError, stage: "skills" as const };
  }

  return { error: null, stage: null };
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
