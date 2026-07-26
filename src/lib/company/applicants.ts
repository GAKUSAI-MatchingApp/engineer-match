import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listBusinessAssessments,
  listHumanAssessments,
  listLatestAttempts,
} from "@/lib/engineer/skill-assessments";
import { canTransitionApplicationStatus } from "@/lib/application-status";

/**
 * Supabase's untyped client (no generated schema types in this project) can't
 * determine embedded-resource cardinality, so a to-one join like
 * `user_skills.select("skills(name)")` types as an array even though
 * PostgREST returns a single object at runtime for a many-to-one FK. This
 * normalizes either shape defensively rather than asserting one.
 */
function firstEmbedded<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * public.applications.status, per 011_applications.sql. 'completed' was
 * added additively in 049_application_completion_status.sql to represent
 * "the work/project actually finished" -- the review-eligibility trigger
 * for the Engineer Review/Rating System (050_engineer_reviews.sql).
 */
export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "completed";

export interface ApplicantListItem {
  id: string; // applications.id
  applicantId: string;
  name: string;
  opportunityId: string;
  opportunityTitle: string;
  contractType: "employment" | "project" | "hourly" | "training";
  status: ApplicationStatus;
  appliedAt: string;
  prefecture: string | null;
  yearsOfExperience: number | null;
  skills: string[];
}

/**
 * Every application submitted to an opportunity this company posted —
 * scoped by applications_select_poster RLS (025_application_policies.sql).
 * Mirrors the batched-lookup shape of listMyApplications()
 * (src/lib/engineer/applications.ts) to avoid N+1 queries.
 */
export async function listCompanyApplicants(
  supabase: SupabaseClient,
  companyUserId: string,
): Promise<ApplicantListItem[]> {
  const { data: opportunities, error: opportunitiesError } = await supabase
    .from("opportunities")
    .select("id, title, contract_type")
    .eq("posted_by", companyUserId)
    .is("deleted_at", null);

  if (opportunitiesError) {
    console.error("[company-applicants] failed to list own opportunities:", opportunitiesError);
    return [];
  }
  if (!opportunities || opportunities.length === 0) return [];

  const opportunityIds = opportunities.map((o) => o.id as string);
  const opportunityById = new Map(opportunities.map((o) => [o.id as string, o]));

  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("id, applicant_id, opportunity_id, status, applied_at")
    .in("opportunity_id", opportunityIds)
    .order("applied_at", { ascending: false });

  if (applicationsError) {
    console.error("[company-applicants] failed to list applications:", applicationsError);
    return [];
  }
  if (!applications || applications.length === 0) return [];

  const applicantIds = [...new Set(applications.map((a) => a.applicant_id as string))];

  const [{ data: users }, { data: profiles }, { data: skillRows }] = await Promise.all([
    supabase.from("users").select("id, name").in("id", applicantIds),
    supabase
      .from("engineer_profiles")
      .select("id, prefecture, years_of_experience")
      .in("id", applicantIds),
    supabase
      .from("user_skills")
      .select("user_id, skills(name)")
      .in("user_id", applicantIds),
  ]);

  const nameById = new Map((users ?? []).map((u) => [u.id as string, u.name as string]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const skillsByUser = new Map<string, string[]>();
  for (const row of (skillRows ?? []) as { user_id: string; skills: unknown }[]) {
    const skillName = firstEmbedded(row.skills as { name: string } | { name: string }[])?.name;
    if (!skillName) continue;
    const userId = row.user_id;
    const list = skillsByUser.get(userId) ?? [];
    list.push(skillName);
    skillsByUser.set(userId, list);
  }

  return applications.map((app) => {
    const opportunity = opportunityById.get(app.opportunity_id as string);
    const profile = profileById.get(app.applicant_id as string);
    return {
      id: app.id as string,
      applicantId: app.applicant_id as string,
      name: nameById.get(app.applicant_id as string) ?? "",
      opportunityId: app.opportunity_id as string,
      opportunityTitle: opportunity ? (opportunity.title as string) : "",
      contractType: opportunity
        ? (opportunity.contract_type as ApplicantListItem["contractType"])
        : "employment",
      status: app.status as ApplicationStatus,
      appliedAt: app.applied_at as string,
      prefecture: (profile?.prefecture as string | null) ?? null,
      yearsOfExperience: (profile?.years_of_experience as number | null) ?? null,
      skills: skillsByUser.get(app.applicant_id as string) ?? [],
    };
  });
}

export interface AssessmentSummary {
  code: string;
  name: string;
  finalLevel: number | null;
}

export interface ApplicantDetail {
  id: string;
  applicantId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  opportunityId: string;
  opportunityTitle: string;
  contractType: "employment" | "project" | "hourly" | "training";
  name: string;
  email: string;
  prefecture: string | null;
  yearsOfExperience: number | null;
  selfPr: string | null;
  workStyle: "REMOTE" | "ONSITE" | "HYBRID" | null;
  desiredRateMin: number | null;
  desiredRateMax: number | null;
  portfolioUrl: string | null;
  jobTitle: string | null;
  jobCategory: string | null;
  availabilityStatus: string | null;
  githubUrl: string | null;
  desiredAnnualIncomeMin: number | null;
  desiredAnnualIncomeMax: number | null;
  desiredHourlyRateMin: number | null;
  desiredHourlyRateMax: number | null;
  availableFrom: string | null;
  /**
   * Phone / nearest station only (public.engineer_contact_details) -- visible
   * here because a real application relationship exists
   * (engineer_contact_details_select_applicant_company RLS,
   * 040_engineer_contact_details.sql). Birth date / gender
   * (engineer_personal_info) are deliberately NEVER selected in this
   * function -- that table has no applicant-company RLS policy at all, by
   * design, so there is nothing to add here even after an application exists.
   */
  phone: string | null;
  nearestStation: string | null;
  technicalSkills: { name: string; level: number | null; experienceYears: number | null }[];
  qualifications: {
    name: string;
    organization: string;
    obtainedYear: number | null;
    expirationDate: string | null;
    noExpiration: boolean;
  }[];
  humanAssessments: AssessmentSummary[];
  businessAssessments: AssessmentSummary[];
  preferredContractTypes: string[];
  preferredLocations: string[];
  workExperiences: {
    id: string;
    companyName: string;
    position: string | null;
    period: string | null;
    employmentType: string | null;
    summary: string | null;
    technologies: string[];
  }[];
  educations: {
    id: string;
    schoolName: string;
    department: string | null;
    period: string | null;
    description: string | null;
  }[];
  languages: { id: string; languageName: string; level: string }[];
  portfolioProjects: {
    id: string;
    title: string;
    role: string | null;
    description: string | null;
    url: string | null;
    period: string | null;
    technologies: string[];
  }[];
}

/**
 * One application, scoped to an opportunity owned by this company. Returns
 * null for "doesn't exist" and "belongs to another company" alike — same
 * collapsing pattern as getCompanyOpportunity() (src/lib/company/jobs.ts) —
 * plus for the (rare, RLS-should-prevent-this) case where a same-shaped id
 * belongs to an opportunity that isn't ours.
 */
export async function getCompanyApplicantDetail(
  supabase: SupabaseClient,
  companyUserId: string,
  applicationId: string,
): Promise<ApplicantDetail | null> {
  const { data: application, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("[company-applicants] failed to load application:", error);
    return null;
  }
  if (!application) return null;

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, title, contract_type, posted_by")
    .eq("id", application.opportunity_id)
    .maybeSingle();

  if (!opportunity || opportunity.posted_by !== companyUserId) return null;

  const applicantId = application.applicant_id as string;

  const [
    { data: userRow },
    { data: profile },
    { data: contactDetails },
    { data: skillRows },
    { data: qualificationRows },
    { data: contractTypeRows },
    { data: locationRows },
    { data: workExperienceRows },
    { data: educationRows },
    { data: languageRows },
    { data: portfolioRows },
  ] = await Promise.all([
    supabase.from("users").select("id, name, email").eq("id", applicantId).maybeSingle(),
    supabase
      .from("engineer_profiles")
      .select(
        "prefecture, years_of_experience, self_pr, work_style, desired_rate_min, desired_rate_max, portfolio_url, job_title, job_category, availability_status, github_url, desired_annual_income_min, desired_annual_income_max, desired_hourly_rate_min, desired_hourly_rate_max, available_from",
      )
      .eq("id", applicantId)
      .maybeSingle(),
    // engineer_contact_details_select_applicant_company (040) -- phone/nearest
    // station only. engineer_personal_info is intentionally never queried here.
    supabase.from("engineer_contact_details").select("phone, nearest_station").eq("id", applicantId).maybeSingle(),
    supabase
      .from("user_skills")
      .select("skill_level, experience_years, skills(name)")
      .eq("user_id", applicantId),
    supabase
      .from("user_qualifications")
      .select("obtained_year, expiration_date, no_expiration, qualifications(name, organization)")
      .eq("user_id", applicantId),
    supabase.from("engineer_preferred_contract_types").select("contract_type").eq("user_id", applicantId),
    supabase.from("engineer_preferred_locations").select("location").eq("user_id", applicantId),
    supabase
      .from("engineer_work_experiences")
      .select(
        "id, company_name, position, period, employment_type, summary, display_order, engineer_work_experience_technologies(technology)",
      )
      .eq("user_id", applicantId)
      .order("display_order"),
    supabase
      .from("engineer_educations")
      .select("id, school_name, department, period, description, display_order")
      .eq("user_id", applicantId)
      .order("display_order"),
    supabase
      .from("engineer_languages")
      .select("id, language_name, level, display_order")
      .eq("user_id", applicantId)
      .order("display_order"),
    supabase
      .from("engineer_portfolio_projects")
      .select(
        "id, title, role, description, url, period, display_order, engineer_portfolio_project_technologies(technology)",
      )
      .eq("user_id", applicantId)
      .order("display_order"),
  ]);

  const [humanAssessments, businessAssessments] = await Promise.all([
    listHumanAssessments(supabase),
    listBusinessAssessments(supabase),
  ]);
  const latestAttempts = await listLatestAttempts(
    supabase,
    applicantId,
    [...humanAssessments, ...businessAssessments].map((a) => a.id),
  );

  return {
    id: application.id as string,
    applicantId,
    status: application.status as ApplicationStatus,
    appliedAt: application.applied_at as string,
    updatedAt: application.updated_at as string,
    opportunityId: opportunity.id as string,
    opportunityTitle: opportunity.title as string,
    contractType: opportunity.contract_type as ApplicantDetail["contractType"],
    name: (userRow?.name as string) ?? "",
    email: (userRow?.email as string) ?? "",
    prefecture: (profile?.prefecture as string | null) ?? null,
    yearsOfExperience: (profile?.years_of_experience as number | null) ?? null,
    selfPr: (profile?.self_pr as string | null) ?? null,
    workStyle: (profile?.work_style as ApplicantDetail["workStyle"]) ?? null,
    desiredRateMin: (profile?.desired_rate_min as number | null) ?? null,
    desiredRateMax: (profile?.desired_rate_max as number | null) ?? null,
    portfolioUrl: (profile?.portfolio_url as string | null) ?? null,
    jobTitle: (profile?.job_title as string | null) ?? null,
    jobCategory: (profile?.job_category as string | null) ?? null,
    availabilityStatus: (profile?.availability_status as string | null) ?? null,
    githubUrl: (profile?.github_url as string | null) ?? null,
    desiredAnnualIncomeMin: (profile?.desired_annual_income_min as number | null) ?? null,
    desiredAnnualIncomeMax: (profile?.desired_annual_income_max as number | null) ?? null,
    desiredHourlyRateMin: (profile?.desired_hourly_rate_min as number | null) ?? null,
    desiredHourlyRateMax: (profile?.desired_hourly_rate_max as number | null) ?? null,
    availableFrom: (profile?.available_from as string | null) ?? null,
    phone: (contactDetails?.phone as string | null) ?? null,
    nearestStation: (contactDetails?.nearest_station as string | null) ?? null,
    technicalSkills: (
      (skillRows ?? []) as { skill_level: number | null; experience_years: number | null; skills: unknown }[]
    ).map((row) => ({
      name: firstEmbedded(row.skills as { name: string } | { name: string }[])?.name ?? "",
      level: row.skill_level,
      experienceYears: row.experience_years,
    })),
    qualifications: (
      (qualificationRows ?? []) as {
        obtained_year: number | null;
        expiration_date: string | null;
        no_expiration: boolean;
        qualifications: unknown;
      }[]
    ).map((row) => {
      const qualification = firstEmbedded(
        row.qualifications as
          | { name: string; organization: string }
          | { name: string; organization: string }[],
      );
      return {
        name: qualification?.name ?? "",
        organization: qualification?.organization ?? "",
        obtainedYear: row.obtained_year,
        expirationDate: row.expiration_date,
        noExpiration: row.no_expiration,
      };
    }),
    humanAssessments: humanAssessments.map((a) => ({
      code: a.code,
      name: a.name,
      finalLevel: latestAttempts.get(a.id)?.final_level ?? null,
    })),
    businessAssessments: businessAssessments.map((a) => ({
      code: a.code,
      name: a.name,
      finalLevel: latestAttempts.get(a.id)?.final_level ?? null,
    })),
    preferredContractTypes: ((contractTypeRows ?? []) as { contract_type: string }[]).map(
      (row) => row.contract_type,
    ),
    preferredLocations: ((locationRows ?? []) as { location: string }[]).map((row) => row.location),
    workExperiences: (
      (workExperienceRows ?? []) as {
        id: string;
        company_name: string;
        position: string | null;
        period: string | null;
        employment_type: string | null;
        summary: string | null;
        engineer_work_experience_technologies: { technology: string }[] | null;
      }[]
    ).map((row) => ({
      id: row.id,
      companyName: row.company_name,
      position: row.position,
      period: row.period,
      employmentType: row.employment_type,
      summary: row.summary,
      technologies: (row.engineer_work_experience_technologies ?? []).map((t) => t.technology),
    })),
    educations: (
      (educationRows ?? []) as {
        id: string;
        school_name: string;
        department: string | null;
        period: string | null;
        description: string | null;
      }[]
    ).map((row) => ({
      id: row.id,
      schoolName: row.school_name,
      department: row.department,
      period: row.period,
      description: row.description,
    })),
    languages: ((languageRows ?? []) as { id: string; language_name: string; level: string }[]).map(
      (row) => ({ id: row.id, languageName: row.language_name, level: row.level }),
    ),
    portfolioProjects: (
      (portfolioRows ?? []) as {
        id: string;
        title: string;
        role: string | null;
        description: string | null;
        url: string | null;
        period: string | null;
        engineer_portfolio_project_technologies: { technology: string }[] | null;
      }[]
    ).map((row) => ({
      id: row.id,
      title: row.title,
      role: row.role,
      description: row.description,
      url: row.url,
      period: row.period,
      technologies: (row.engineer_portfolio_project_technologies ?? []).map((t) => t.technology),
    })),
  };
}

/**
 * Forward pipeline the company UI offers. 'withdrawn' is deliberately absent
 * -- that transition is reserved for the applicant (applications_update_withdraw
 * RLS, 025_application_policies.sql), and the company UI never offers it even
 * though applications_update_poster's WITH CHECK doesn't itself forbid it.
 */
export const STATUS_NEXT_STEP: Record<ApplicationStatus, ApplicationStatus | null> = {
  applied: "screening",
  screening: "interview",
  interview: "accepted",
  accepted: "completed",
  rejected: null,
  withdrawn: null,
  completed: null,
};

/** Statuses a company may still reject from. */
export const COMPANY_REJECTABLE_STATUSES: readonly ApplicationStatus[] = [
  "applied",
  "screening",
  "interview",
];

/**
 * Updates an application's status. Relies entirely on applications_update_poster
 * RLS (025_application_policies.sql) for ownership enforcement — no explicit
 * posted_by filter is possible here since applications has no posted_by column
 * of its own (only reachable via its parent opportunity). Stamps completed_at
 * (049_application_completion_status.sql) when transitioning into 'completed'.
 *
 * currentStatus is required and checked against the shared transition graph
 * (src/lib/application-status.ts, RD-2026-001 BR-53/BR-54) before any request
 * is sent — this is UX only, the real boundary is
 * trg_applications_status_transition (DB trigger), so a direct API call that
 * skips this function is still rejected by Postgres.
 */
export async function updateApplicationStatus(
  supabase: SupabaseClient,
  applicationId: string,
  currentStatus: ApplicationStatus,
  nextStatus: ApplicationStatus,
) {
  if (!canTransitionApplicationStatus(currentStatus, nextStatus)) {
    return {
      data: null,
      error: { message: "この応募は現在のステータスからこの操作を行うことはできません。" },
    };
  }

  const payload: { status: ApplicationStatus; completed_at?: string } = { status: nextStatus };
  if (nextStatus === "completed") {
    payload.completed_at = new Date().toISOString();
  }

  return supabase.from("applications").update(payload).eq("id", applicationId).select("*").single();
}
