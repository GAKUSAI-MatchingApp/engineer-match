import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listBusinessAssessments,
  listHumanAssessments,
  listLatestAttempts,
} from "@/lib/engineer/skill-assessments";

/**
 * Supabase's untyped client (no generated schema types in this project) can't
 * determine embedded-resource cardinality, so a to-one join types as an array
 * even though PostgREST returns a single object at runtime for a many-to-one
 * FK. Mirrors firstEmbedded() in src/lib/company/applicants.ts.
 */
function firstEmbedded<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export interface EngineerSearchListItem {
  id: string; // users.id / engineer_profiles.id
  name: string;
  prefecture: string | null;
  yearsOfExperience: number | null;
  workStyle: "REMOTE" | "ONSITE" | "HYBRID" | null;
  jobTitle: string | null;
  jobCategory: string | null;
  availabilityStatus: string | null;
  technicalSkills: { name: string; level: number | null }[];
  qualificationCount: number;
  humanAssessedCount: number;
  businessAssessedCount: number;
  reviewAverage: number | null;
  reviewCount: number;
}

/**
 * Every ACTIVE, is_public=true ENGINEER -- scoped entirely by RLS
 * (engineer_profiles_select_public / users_select_public_engineer /
 * user_skills_select_public_engineer / user_qualifications_select_public_engineer,
 * 035_engineer_search_visibility_policies.sql). This is engineer DISCOVERY,
 * not applicant review, so it does not require any application relationship.
 * Batched lookups (no N+1), same shape as listCompanyApplicants()
 * (src/lib/company/applicants.ts).
 */
export async function listSearchableEngineers(
  supabase: SupabaseClient,
): Promise<EngineerSearchListItem[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from("engineer_profiles")
    .select("id, prefecture, years_of_experience, work_style, job_title, job_category, availability_status");

  if (profilesError) {
    console.error("[company-engineers] failed to list engineer profiles:", profilesError);
    return [];
  }
  if (!profiles || profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id as string);

  const [
    { data: users },
    { data: skillRows },
    { data: qualificationRows },
    { data: reviewRows },
    humanAssessments,
    businessAssessments,
  ] = await Promise.all([
    supabase.from("users").select("id, name").in("id", ids),
    supabase.from("user_skills").select("user_id, skill_level, skills(name)").in("user_id", ids),
    supabase.from("user_qualifications").select("user_id").in("user_id", ids),
    // engineer_reviews_select_public RLS (050_engineer_reviews.sql) already
    // restricts this to engineers with show_reviews=true -- an engineer who
    // has hidden their reviews simply returns zero rows here, same as one
    // with no reviews yet, by design.
    supabase.from("engineer_reviews").select("engineer_user_id, rating").in("engineer_user_id", ids),
    listHumanAssessments(supabase),
    listBusinessAssessments(supabase),
  ]);

  const assessmentIds = [...humanAssessments, ...businessAssessments].map((a) => a.id);
  const humanIds = new Set(humanAssessments.map((a) => a.id));
  const businessIds = new Set(businessAssessments.map((a) => a.id));

  // listLatestAttempts is scoped to one user_id; batch it ourselves here
  // across all searchable engineers in a single query instead.
  const attemptsByUser = new Map<string, { assessment_id: string }[]>();
  if (assessmentIds.length > 0) {
    const { data: attempts, error: attemptsError } = await supabase
      .from("skill_assessment_attempts")
      .select("user_id, assessment_id")
      .in("user_id", ids)
      .in("assessment_id", assessmentIds);

    if (attemptsError) {
      console.error("[company-engineers] failed to list assessment attempts:", attemptsError);
    } else {
      for (const row of (attempts ?? []) as { user_id: string; assessment_id: string }[]) {
        const list = attemptsByUser.get(row.user_id) ?? [];
        list.push({ assessment_id: row.assessment_id });
        attemptsByUser.set(row.user_id, list);
      }
    }
  }

  const nameById = new Map((users ?? []).map((u) => [u.id as string, u.name as string]));
  const profileById = new Map(profiles.map((p) => [p.id as string, p]));

  const skillsByUser = new Map<string, { name: string; level: number | null }[]>();
  for (const row of (skillRows ?? []) as {
    user_id: string;
    skill_level: number | null;
    skills: unknown;
  }[]) {
    const skillName = firstEmbedded(row.skills as { name: string } | { name: string }[])?.name;
    if (!skillName) continue;
    const list = skillsByUser.get(row.user_id) ?? [];
    list.push({ name: skillName, level: row.skill_level });
    skillsByUser.set(row.user_id, list);
  }

  const qualificationCountByUser = new Map<string, number>();
  for (const row of (qualificationRows ?? []) as { user_id: string }[]) {
    qualificationCountByUser.set(row.user_id, (qualificationCountByUser.get(row.user_id) ?? 0) + 1);
  }

  const reviewTotalsByUser = new Map<string, { sum: number; count: number }>();
  for (const row of (reviewRows ?? []) as { engineer_user_id: string; rating: number }[]) {
    const totals = reviewTotalsByUser.get(row.engineer_user_id) ?? { sum: 0, count: 0 };
    totals.sum += row.rating;
    totals.count += 1;
    reviewTotalsByUser.set(row.engineer_user_id, totals);
  }

  return ids
    .filter((id) => nameById.has(id))
    .map((id) => {
      const profile = profileById.get(id);
      const attempts = attemptsByUser.get(id) ?? [];
      const reviewTotals = reviewTotalsByUser.get(id);
      return {
        id,
        name: nameById.get(id) ?? "",
        prefecture: (profile?.prefecture as string | null) ?? null,
        yearsOfExperience: (profile?.years_of_experience as number | null) ?? null,
        workStyle: (profile?.work_style as EngineerSearchListItem["workStyle"]) ?? null,
        jobTitle: (profile?.job_title as string | null) ?? null,
        jobCategory: (profile?.job_category as string | null) ?? null,
        availabilityStatus: (profile?.availability_status as string | null) ?? null,
        technicalSkills: skillsByUser.get(id) ?? [],
        qualificationCount: qualificationCountByUser.get(id) ?? 0,
        humanAssessedCount: attempts.filter((a) => humanIds.has(a.assessment_id)).length,
        businessAssessedCount: attempts.filter((a) => businessIds.has(a.assessment_id)).length,
        reviewAverage: reviewTotals ? Math.round((reviewTotals.sum / reviewTotals.count) * 10) / 10 : null,
        reviewCount: reviewTotals?.count ?? 0,
      };
    });
}

export interface EngineerAssessmentSummary {
  code: string;
  name: string;
  finalLevel: number | null;
}

export interface EngineerDetail {
  id: string;
  name: string;
  prefecture: string | null;
  yearsOfExperience: number | null;
  selfPr: string | null;
  workStyle: "REMOTE" | "ONSITE" | "HYBRID" | null;
  portfolioUrl: string | null;
  jobTitle: string | null;
  jobCategory: string | null;
  availabilityStatus: string | null;
  githubUrl: string | null;
  desiredAnnualIncome: number | null;
  desiredHourlyRateMin: number | null;
  desiredHourlyRateMax: number | null;
  availableFrom: string | null;
  technicalSkills: { name: string; level: number | null; experienceYears: number | null }[];
  qualifications: {
    name: string;
    organization: string;
    obtainedYear: number | null;
    expirationDate: string | null;
    noExpiration: boolean;
  }[];
  humanAssessments: EngineerAssessmentSummary[];
  businessAssessments: EngineerAssessmentSummary[];
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
 * One searchable engineer's detail. Returns null uniformly for "doesn't
 * exist", "not an engineer", and "no longer public/active" -- RLS
 * (035_engineer_search_visibility_policies.sql) makes all three collapse to
 * the same "no row" result, so there is nothing to branch on here. Does not
 * select users.email, engineer_personal_info, or engineer_contact_details:
 * the search/discovery detail is pre-application, so personal/contact info
 * stays hidden here by construction -- it's only ever surfaced in
 * src/lib/company/applicants.ts's ApplicantDetail (and even there, only the
 * contact_details half, never personal_info).
 */
export async function getSearchableEngineerDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<EngineerDetail | null> {
  const { data: profile, error: profileError } = await supabase
    .from("engineer_profiles")
    .select(
      "id, prefecture, years_of_experience, self_pr, work_style, portfolio_url, job_title, job_category, availability_status, github_url, desired_annual_income_yen, desired_hourly_rate_min, desired_hourly_rate_max, available_from",
    )
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    console.error("[company-engineers] failed to load engineer profile:", profileError);
    return null;
  }
  if (!profile) return null;

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (userError) {
    console.error("[company-engineers] failed to load user row:", userError);
    return null;
  }
  if (!userRow) return null;

  const [
    { data: skillRows },
    { data: qualificationRows },
    humanAssessments,
    businessAssessments,
    { data: contractTypeRows },
    { data: locationRows },
    { data: workExperienceRows },
    { data: educationRows },
    { data: languageRows },
    { data: portfolioRows },
  ] = await Promise.all([
    supabase.from("user_skills").select("skill_level, experience_years, skills(name)").eq("user_id", id),
    supabase
      .from("user_qualifications")
      .select("obtained_year, expiration_date, no_expiration, qualifications(name, organization)")
      .eq("user_id", id),
    listHumanAssessments(supabase),
    listBusinessAssessments(supabase),
    supabase.from("engineer_preferred_contract_types").select("contract_type").eq("user_id", id),
    supabase.from("engineer_preferred_locations").select("location").eq("user_id", id),
    supabase
      .from("engineer_work_experiences")
      .select(
        "id, company_name, position, period, employment_type, summary, display_order, engineer_work_experience_technologies(technology)",
      )
      .eq("user_id", id)
      .order("display_order"),
    supabase
      .from("engineer_educations")
      .select("id, school_name, department, period, description, display_order")
      .eq("user_id", id)
      .order("display_order"),
    supabase
      .from("engineer_languages")
      .select("id, language_name, level, display_order")
      .eq("user_id", id)
      .order("display_order"),
    supabase
      .from("engineer_portfolio_projects")
      .select(
        "id, title, role, description, url, period, display_order, engineer_portfolio_project_technologies(technology)",
      )
      .eq("user_id", id)
      .order("display_order"),
  ]);

  const latestAttempts = await listLatestAttempts(
    supabase,
    id,
    [...humanAssessments, ...businessAssessments].map((a) => a.id),
  );

  return {
    id: userRow.id as string,
    name: userRow.name as string,
    prefecture: (profile.prefecture as string | null) ?? null,
    yearsOfExperience: (profile.years_of_experience as number | null) ?? null,
    selfPr: (profile.self_pr as string | null) ?? null,
    workStyle: (profile.work_style as EngineerDetail["workStyle"]) ?? null,
    portfolioUrl: (profile.portfolio_url as string | null) ?? null,
    jobTitle: (profile.job_title as string | null) ?? null,
    jobCategory: (profile.job_category as string | null) ?? null,
    availabilityStatus: (profile.availability_status as string | null) ?? null,
    githubUrl: (profile.github_url as string | null) ?? null,
    desiredAnnualIncome: (profile.desired_annual_income_yen as number | null) ?? null,
    desiredHourlyRateMin: (profile.desired_hourly_rate_min as number | null) ?? null,
    desiredHourlyRateMax: (profile.desired_hourly_rate_max as number | null) ?? null,
    availableFrom: (profile.available_from as string | null) ?? null,
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
