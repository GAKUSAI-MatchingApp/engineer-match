/**
 * public.opportunities.contract_type / work_style vocabulary, per
 * supabase/migrations/005-010. Shared DB-enum vocabulary and Japanese
 * display labels used by both Engineer (src/constants/jobs.ts,
 * src/constants/applications.ts) and Company (src/constants/company-jobs.ts)
 * constants modules — single source of truth so the two sides can never
 * drift out of sync with each other or with the DB CHECK constraints.
 */

export const CONTRACT_TYPE_OPTIONS = [
  { value: "employment", label: "就職" },
  { value: "project", label: "案件" },
  { value: "hourly", label: "時間精算" },
] as const;
export type CompanyContractType = (typeof CONTRACT_TYPE_OPTIONS)[number]["value"];

// Record<string, string> rather than Record<CompanyContractType, string> —
// some call sites (e.g. training-adjacent content) index these with a wider
// string type than the three canonical opportunity contract types, so a
// stricter key type would reject otherwise-valid lookups at those sites.
export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  employment: "就職",
  project: "案件",
  hourly: "時間精算",
};

export const CONTRACT_TYPE_BADGE_STYLES: Record<string, string> = {
  employment: "bg-blue-50 text-blue-700",
  project: "bg-indigo-50 text-primary",
  hourly: "bg-amber-50 text-amber-700",
};

/** opportunity_employment.work_style, per chk_opportunity_employment_work_style (006_opportunity_employment.sql). BR-39 search filter. */
export const WORK_STYLE_OPTIONS = [
  { value: "REMOTE", label: "フルリモート" },
  { value: "ONSITE", label: "出社" },
  { value: "HYBRID", label: "一部リモート" },
] as const;
export type WorkStyleValue = (typeof WORK_STYLE_OPTIONS)[number]["value"];

export const WORK_STYLE_LABEL: Record<string, string> = {
  REMOTE: "フルリモート",
  ONSITE: "出社",
  HYBRID: "一部リモート",
};

export const WORK_STYLE_BADGE_STYLES: Record<string, string> = {
  REMOTE: "bg-teal-50 text-teal-700",
  ONSITE: "bg-muted text-muted-foreground",
  HYBRID: "bg-cyan-50 text-cyan-700",
};
