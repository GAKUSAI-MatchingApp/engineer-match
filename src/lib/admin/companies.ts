import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminUserStatus } from "@/lib/admin/users";
import { resolveCompanyIndustryName } from "@/lib/company/profile";

/** public.company_profiles.company_size (004_profile_tables.sql: chk_company_profiles_size). */
export const ADMIN_COMPANY_SIZE_LABEL: Record<string, string> = {
  "1-10": "1〜10名",
  "11-50": "11〜50名",
  "51-100": "51〜100名",
  "101-300": "101〜300名",
  "301-1000": "301〜1000名",
  "1001+": "1001名以上",
};

/** public.opportunities.status (005_opportunities.sql). */
export const ADMIN_OPPORTUNITY_STATUS_LABEL: Record<string, string> = {
  draft: "下書き",
  published: "公開中",
  closed: "終了",
};

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export interface AdminCompanyListItem {
  id: string;
  name: string;
  industry: string | null;
  companySize: string | null;
  contactName: string | null;
  contactEmail: string;
  jobCount: number;
  usageStatus: AdminUserStatus;
  createdAtLabel: string;
  createdAtISO: string;
}

const LIST_CAP = 1000;

/**
 * Real company list. company_profiles has no review/approval-status column
 * (see the audit), so there is no "審査中/承認済み" workflow here -- only the
 * owning account's real users.status (suspend/reinstate). jobCount is a real
 * count against opportunities.posted_by.
 */
export async function listAdminCompanies(supabase: SupabaseClient): Promise<AdminCompanyListItem[]> {
  const { data: companies, error } = await supabase
    .from("company_profiles")
    .select(
      "id, company_name, industry, industry_category_id, industry_category:industry_categories(name, is_active), company_size, contact_person, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(LIST_CAP);

  if (error) {
    console.error("[admin] failed to list companies:", error);
    return [];
  }
  if (!companies || companies.length === 0) return [];

  const ids = companies.map((c) => c.id as string);
  const [{ data: users }, { data: opportunities }] = await Promise.all([
    supabase.from("users").select("id, email, status").in("id", ids),
    supabase.from("opportunities").select("id, posted_by").in("posted_by", ids),
  ]);

  const userById = new Map((users ?? []).map((row) => [row.id as string, row]));
  const jobCountByOwner = new Map<string, number>();
  for (const row of opportunities ?? []) {
    const ownerId = row.posted_by as string;
    jobCountByOwner.set(ownerId, (jobCountByOwner.get(ownerId) ?? 0) + 1);
  }

  return companies.map((row) => {
    const user = userById.get(row.id as string);
    return {
      id: row.id as string,
      name: (row.company_name as string) || "（企業名未設定）",
      industry: resolveCompanyIndustryName({
        industry: (row.industry as string | null) ?? null,
        industry_category_id: (row.industry_category_id as string | null) ?? null,
        industry_category: row.industry_category as
          | { name?: string | null; is_active?: boolean | null }
          | Array<{ name?: string | null; is_active?: boolean | null }>
          | null,
      }),
      companySize: (row.company_size as string | null) ?? null,
      contactName: (row.contact_person as string | null) ?? null,
      contactEmail: (user?.email as string | undefined) ?? "",
      jobCount: jobCountByOwner.get(row.id as string) ?? 0,
      usageStatus: (user?.status as AdminUserStatus | undefined) ?? "ACTIVE",
      createdAtLabel: formatDateLabel(row.created_at as string),
      createdAtISO: row.created_at as string,
    };
  });
}

export interface AdminCompanyJobSummary {
  id: string;
  title: string;
  statusLabel: string;
  applicantCount: number;
}

export interface AdminCompanyDetail extends AdminCompanyListItem {
  address: string | null;
  websiteUrl: string | null;
  businessDescription: string | null;
  establishedYear: number | null;
  jobs: AdminCompanyJobSummary[];
}

export async function getAdminCompanyDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<AdminCompanyDetail | null> {
  const { data: row, error } = await supabase
    .from("company_profiles")
    .select(
      "id, company_name, industry, industry_category_id, industry_category:industry_categories(name, is_active), company_size, contact_person, address, website_url, business_description, established_year, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] failed to load company detail:", error);
    return null;
  }
  if (!row) return null;

  const [{ data: user }, { data: opportunities }] = await Promise.all([
    supabase.from("users").select("email, status").eq("id", id).maybeSingle(),
    supabase
      .from("opportunities")
      .select("id, title, status")
      .eq("posted_by", id)
      .order("created_at", { ascending: false }),
  ]);

  const oppIds = (opportunities ?? []).map((o) => o.id as string);
  const { data: applications } =
    oppIds.length > 0
      ? await supabase.from("applications").select("opportunity_id").in("opportunity_id", oppIds)
      : { data: [] as { opportunity_id: string }[] };
  const applicantCountByOpp = new Map<string, number>();
  for (const a of applications ?? []) {
    const oppId = a.opportunity_id as string;
    applicantCountByOpp.set(oppId, (applicantCountByOpp.get(oppId) ?? 0) + 1);
  }

  return {
    id: row.id as string,
    name: (row.company_name as string) || "（企業名未設定）",
    industry: resolveCompanyIndustryName({
      industry: (row.industry as string | null) ?? null,
      industry_category_id: (row.industry_category_id as string | null) ?? null,
      industry_category: row.industry_category as
        | { name?: string | null; is_active?: boolean | null }
        | Array<{ name?: string | null; is_active?: boolean | null }>
        | null,
    }),
    companySize: (row.company_size as string | null) ?? null,
    contactName: (row.contact_person as string | null) ?? null,
    contactEmail: (user?.email as string | undefined) ?? "",
    jobCount: (opportunities ?? []).length,
    usageStatus: (user?.status as AdminUserStatus | undefined) ?? "ACTIVE",
    createdAtLabel: formatDateLabel(row.created_at as string),
    createdAtISO: row.created_at as string,
    address: (row.address as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    businessDescription: (row.business_description as string | null) ?? null,
    establishedYear: (row.established_year as number | null) ?? null,
    jobs: (opportunities ?? []).map((o) => ({
      id: o.id as string,
      title: o.title as string,
      statusLabel: ADMIN_OPPORTUNITY_STATUS_LABEL[o.status as string] ?? (o.status as string),
      applicantCount: applicantCountByOpp.get(o.id as string) ?? 0,
    })),
  };
}
