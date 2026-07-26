import type { SupabaseClient } from "@supabase/supabase-js";
import { hydrateOpportunities, type CompanyContractType } from "@/lib/engineer/opportunities";
import { formatSalaryLabel } from "@/lib/engineer/format";
import { writeAdminAuditLog } from "@/lib/admin/audit";

/** public.opportunities.status (005_opportunities.sql). */
export type AdminOpportunityStatus = "draft" | "published" | "closed";
/** public.opportunities.contract_type. */
export type AdminOpportunityContractType = "employment" | "project" | "hourly" | "training";

export const ADMIN_OPPORTUNITY_STATUS_LABEL: Record<AdminOpportunityStatus, string> = {
  draft: "下書き",
  published: "公開中",
  closed: "終了",
};

export const ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL: Record<AdminOpportunityContractType, string> = {
  employment: "就職",
  project: "案件",
  hourly: "時間清算",
  training: "研修",
};

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export interface AdminOpportunityListItem {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  contractType: AdminOpportunityContractType;
  status: AdminOpportunityStatus;
  unpublishedByAdmin: boolean;
  conditionsLabel: string;
  applicantCount: number;
  createdAtLabel: string;
  createdAtISO: string;
}

const LIST_CAP = 1000;

export async function listAdminOpportunities(
  supabase: SupabaseClient,
): Promise<AdminOpportunityListItem[]> {
  const { data: rows, error } = await supabase
    .from("opportunities")
    .select("id, title, contract_type, status, unpublished_by_admin, posted_by, created_at, updated_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(LIST_CAP);

  if (error) {
    console.error("[admin] failed to list opportunities:", error);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  const [hydrated, applicationsRes] = await Promise.all([
    hydrateOpportunities(
      supabase,
      rows.map((r) => ({
        id: r.id as string,
        title: r.title as string,
        contract_type: r.contract_type as string,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
        posted_by: r.posted_by as string,
      })),
    ),
    supabase
      .from("applications")
      .select("opportunity_id")
      .in(
        "opportunity_id",
        rows.map((r) => r.id as string),
      ),
  ]);

  const hydratedById = new Map(hydrated.map((h) => [h.id, h]));
  const applicantCountByOpp = new Map<string, number>();
  for (const a of applicationsRes.data ?? []) {
    const oppId = a.opportunity_id as string;
    applicantCountByOpp.set(oppId, (applicantCountByOpp.get(oppId) ?? 0) + 1);
  }

  return rows.map((row) => {
    const hydratedRow = hydratedById.get(row.id as string);
    const contractType = row.contract_type as AdminOpportunityContractType;
    const conditionsLabel =
      contractType === "training"
        ? ""
        : hydratedRow
          ? formatSalaryLabel({
              contract_type: contractType as CompanyContractType,
              salaryMin: hydratedRow.salaryMin,
              salaryMax: hydratedRow.salaryMax,
              budget: hydratedRow.budget,
              hourlyRate: hydratedRow.hourlyRate,
            })
          : "";
    return {
      id: row.id as string,
      title: row.title as string,
      companyId: row.posted_by as string,
      companyName: hydratedRow?.companyName ?? "",
      contractType,
      status: row.status as AdminOpportunityStatus,
      unpublishedByAdmin: row.unpublished_by_admin as boolean,
      conditionsLabel,
      applicantCount: applicantCountByOpp.get(row.id as string) ?? 0,
      createdAtLabel: formatDateLabel(row.created_at as string),
      createdAtISO: row.created_at as string,
    };
  });
}

export interface AdminOpportunityReportEntry {
  id: string;
  reasonSummary: string;
  reporterName: string;
  statusLabel: string;
  dateLabel: string;
}

export interface AdminOpportunityHistoryEntry {
  id: string;
  actionType: string;
  actor: string;
  reason: string | null;
  dateLabel: string;
}

export interface AdminOpportunityDetail extends AdminOpportunityListItem {
  description: string;
  requiredSkillNames: string[];
  reportHistory: AdminOpportunityReportEntry[];
  publicationHistory: AdminOpportunityHistoryEntry[];
}

const REPORT_STATUS_LABEL: Record<string, string> = {
  pending: "未対応",
  in_progress: "対応中",
  resolved: "解決済み",
  rejected: "却下",
};

export async function getAdminOpportunityDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<AdminOpportunityDetail | null> {
  const { data: row, error } = await supabase
    .from("opportunities")
    .select(
      "id, title, description, contract_type, status, unpublished_by_admin, posted_by, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] failed to load opportunity detail:", error);
    return null;
  }
  if (!row) return null;

  const [hydrated, { data: applications }, { data: skillLinks }, { data: reportRows }, { data: auditRows }] =
    await Promise.all([
      hydrateOpportunities(supabase, [
        {
          id: row.id as string,
          title: row.title as string,
          contract_type: row.contract_type as string,
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
          posted_by: row.posted_by as string,
        },
      ]),
      supabase.from("applications").select("id").eq("opportunity_id", id),
      supabase.from("opportunity_required_skills").select("skill_id").eq("opportunity_id", id),
      supabase
        .from("abuse_reports")
        .select("id, reason, status, reporter_id, created_at")
        .eq("target_type", "opportunity")
        .eq("target_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("admin_audit_logs")
        .select("id, action_type, reason, admin_user_id, created_at")
        .eq("target_type", "opportunity")
        .eq("target_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const reporterIds = [...new Set((reportRows ?? []).map((r) => r.reporter_id as string))];
  const { data: reporters } =
    reporterIds.length > 0
      ? await supabase.from("users").select("id, name").in("id", reporterIds)
      : { data: [] as { id: string; name: string }[] };
  const reporterNameById = new Map((reporters ?? []).map((r) => [r.id as string, r.name as string]));

  const adminIds = [...new Set((auditRows ?? []).map((r) => r.admin_user_id as string))];
  const { data: admins } =
    adminIds.length > 0
      ? await supabase.from("users").select("id, name").in("id", adminIds)
      : { data: [] as { id: string; name: string }[] };
  const adminNameById = new Map((admins ?? []).map((r) => [r.id as string, r.name as string]));

  const hydratedRow = hydrated[0];
  const contractType = row.contract_type as AdminOpportunityContractType;

  const skillIds = (skillLinks ?? []).map((r) => r.skill_id as string);
  let requiredSkillNames: string[] = [];
  if (skillIds.length > 0) {
    const { data: skillRows } = await supabase.from("skills").select("name").in("id", skillIds);
    requiredSkillNames = (skillRows ?? []).map((r) => r.name as string);
  }

  const conditionsLabel =
    contractType === "training"
      ? ""
      : hydratedRow
        ? formatSalaryLabel({
            contract_type: contractType as CompanyContractType,
            salaryMin: hydratedRow.salaryMin,
            salaryMax: hydratedRow.salaryMax,
            budget: hydratedRow.budget,
            hourlyRate: hydratedRow.hourlyRate,
          })
        : "";

  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    companyId: row.posted_by as string,
    companyName: hydratedRow?.companyName ?? "",
    contractType,
    status: row.status as AdminOpportunityStatus,
    unpublishedByAdmin: row.unpublished_by_admin as boolean,
    conditionsLabel,
    applicantCount: (applications ?? []).length,
    createdAtLabel: formatDateLabel(row.created_at as string),
    createdAtISO: row.created_at as string,
    requiredSkillNames,
    reportHistory: (reportRows ?? []).map((r) => ({
      id: r.id as string,
      reasonSummary: (r.reason as string).slice(0, 80),
      reporterName: reporterNameById.get(r.reporter_id as string) ?? "不明なユーザー",
      statusLabel: REPORT_STATUS_LABEL[r.status as string] ?? (r.status as string),
      dateLabel: formatDateLabel(r.created_at as string),
    })),
    publicationHistory: (auditRows ?? []).map((r) => ({
      id: r.id as string,
      actionType: r.action_type as string,
      actor: adminNameById.get(r.admin_user_id as string) ?? "管理者",
      reason: (r.reason as string | null) ?? null,
      dateLabel: formatDateLabel(r.created_at as string),
    })),
  };
}

export type AdminOpportunityModerationAction = "takedown" | "republish" | "close";

export interface UpdateOpportunityModerationResult {
  error: string | null;
}

/**
 * The only two real admin-moderation levers on opportunities:
 * unpublished_by_admin (a takedown flag independent of the company's own
 * status) and status itself (draft/published/closed). There is no "approve
 * for publish" action -- companies publish their own opportunities; admin
 * can only take one down (and undo that), or force-close it. Relies on
 * opportunities_admin_update RLS (024_opportunity_policies.sql).
 */
export async function updateOpportunityModeration(
  supabase: SupabaseClient,
  opportunityId: string,
  action: AdminOpportunityModerationAction,
  reason?: string | null,
): Promise<UpdateOpportunityModerationResult> {
  const { data: before, error: beforeError } = await supabase
    .from("opportunities")
    .select("status, unpublished_by_admin")
    .eq("id", opportunityId)
    .maybeSingle();

  if (beforeError || !before) {
    console.error("[admin] failed to load opportunity before moderation:", beforeError);
    return { error: "求人・案件情報の取得に失敗しました。" };
  }

  // RD-2026-001 BR-91: a takedown must always carry a non-empty, <=500 char
  // reason -- re-validated here (not just in the dialog) so a caller that
  // skips the UI still cannot record a takedown with no reason.
  const trimmedReason = reason?.trim() ?? "";
  if (action === "takedown") {
    if (trimmedReason.length === 0) {
      return { error: "非公開にする理由を入力してください。" };
    }
    if (trimmedReason.length > 500) {
      return { error: "非公開にする理由は500文字以内で入力してください。" };
    }
  }

  let payload: { status?: AdminOpportunityStatus; unpublished_by_admin?: boolean };
  if (action === "takedown") {
    if (before.status !== "published" || before.unpublished_by_admin) {
      return { error: "この求人・案件は現在、非公開化の対象ではありません。" };
    }
    payload = { unpublished_by_admin: true };
  } else if (action === "republish") {
    if (!before.unpublished_by_admin) {
      return { error: "この求人・案件は管理者による非公開化の対象ではありません。" };
    }
    payload = { unpublished_by_admin: false };
  } else {
    if (before.status === "closed") {
      return { error: "この求人・案件はすでに終了しています。" };
    }
    payload = { status: "closed" };
  }

  const { data: updated, error } = await supabase
    .from("opportunities")
    .update(payload)
    .eq("id", opportunityId)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to update opportunity moderation:", error);
    return { error: "更新に失敗しました。権限を確認してください。" };
  }

  await writeAdminAuditLog(supabase, {
    actionType: `opportunity_${action}`,
    targetType: "opportunity",
    targetId: opportunityId,
    beforeData: before,
    afterData: { ...before, ...payload },
    reason: action === "takedown" ? trimmedReason : null,
  });

  return { error: null };
}
