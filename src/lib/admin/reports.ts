import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAdminAuditLog } from "@/lib/admin/audit";

/** public.abuse_reports.status (017_abuse_reports.sql). */
export type AdminReportStatus = "pending" | "in_progress" | "resolved" | "rejected";
/** public.abuse_reports.target_type. */
export type AdminReportTargetType = "user" | "company" | "opportunity";

export const ADMIN_REPORT_STATUS_LABEL: Record<AdminReportStatus, string> = {
  pending: "未対応",
  in_progress: "対応中",
  resolved: "解決済み",
  rejected: "却下",
};

export const ADMIN_REPORT_STATUS_TONE: Record<AdminReportStatus, "negative" | "warning" | "positive" | "neutral"> = {
  pending: "negative",
  in_progress: "warning",
  resolved: "positive",
  rejected: "neutral",
};

export const ADMIN_REPORT_TARGET_TYPE_LABEL: Record<AdminReportTargetType, string> = {
  user: "ユーザー",
  company: "企業",
  opportunity: "求人・案件",
};

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export interface AdminReportListItem {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: AdminReportTargetType;
  targetId: string;
  targetLabel: string;
  targetHref: string | null;
  status: AdminReportStatus;
  assigneeName: string | null;
  createdAtLabel: string;
  createdAtISO: string;
}

const LIST_CAP = 1000;

function targetHref(type: AdminReportTargetType, id: string): string {
  if (type === "user") return `/admin/users/${id}`;
  if (type === "company") return `/admin/companies/${id}`;
  return `/admin/opportunities/${id}`;
}

async function resolveTargetLabels(
  supabase: SupabaseClient,
  rows: { target_type: string; target_id: string }[],
): Promise<Map<string, string>> {
  const userIds = rows.filter((r) => r.target_type === "user").map((r) => r.target_id);
  const companyIds = rows.filter((r) => r.target_type === "company").map((r) => r.target_id);
  const oppIds = rows.filter((r) => r.target_type === "opportunity").map((r) => r.target_id);

  const [usersRes, companiesRes, oppsRes] = await Promise.all([
    userIds.length > 0
      ? supabase.from("users").select("id, name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    companyIds.length > 0
      ? supabase.from("company_profiles").select("id, company_name").in("id", companyIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
    oppIds.length > 0
      ? supabase.from("opportunities").select("id, title").in("id", oppIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const labelByKey = new Map<string, string>();
  for (const row of usersRes.data ?? []) labelByKey.set(`user:${row.id}`, row.name as string);
  for (const row of companiesRes.data ?? []) labelByKey.set(`company:${row.id}`, row.company_name as string);
  for (const row of oppsRes.data ?? []) labelByKey.set(`opportunity:${row.id}`, row.title as string);
  return labelByKey;
}

export async function listAdminReports(supabase: SupabaseClient): Promise<AdminReportListItem[]> {
  const { data: rows, error } = await supabase
    .from("abuse_reports")
    .select("id, reporter_id, target_type, target_id, status, handled_by, created_at")
    .order("created_at", { ascending: false })
    .limit(LIST_CAP);

  if (error) {
    console.error("[admin] failed to list reports:", error);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  const reporterIds = [...new Set(rows.map((r) => r.reporter_id as string))];
  const assigneeIds = [...new Set((rows.map((r) => r.handled_by as string | null).filter(Boolean) as string[]))];
  const [{ data: reporters }, { data: assignees }, labelByKey] = await Promise.all([
    supabase.from("users").select("id, name").in("id", reporterIds),
    assigneeIds.length > 0
      ? supabase.from("users").select("id, name").in("id", assigneeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    resolveTargetLabels(
      supabase,
      rows.map((r) => ({ target_type: r.target_type as string, target_id: r.target_id as string })),
    ),
  ]);

  const reporterNameById = new Map((reporters ?? []).map((r) => [r.id as string, r.name as string]));
  const assigneeNameById = new Map((assignees ?? []).map((r) => [r.id as string, r.name as string]));

  return rows.map((row) => {
    const targetType = row.target_type as AdminReportTargetType;
    const targetId = row.target_id as string;
    return {
      id: row.id as string,
      reporterId: row.reporter_id as string,
      reporterName: reporterNameById.get(row.reporter_id as string) ?? "不明なユーザー",
      targetType,
      targetId,
      targetLabel: labelByKey.get(`${targetType}:${targetId}`) ?? "（削除済み）",
      targetHref: targetHref(targetType, targetId),
      status: row.status as AdminReportStatus,
      assigneeName: row.handled_by ? (assigneeNameById.get(row.handled_by as string) ?? null) : null,
      createdAtLabel: formatDateLabel(row.created_at as string),
      createdAtISO: row.created_at as string,
    };
  });
}

export interface AdminReportDetail extends AdminReportListItem {
  reason: string;
  adminNote: string | null;
  handledAtLabel: string | null;
}

export async function getAdminReportDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<AdminReportDetail | null> {
  const { data: row, error } = await supabase
    .from("abuse_reports")
    .select("id, reporter_id, target_type, target_id, reason, status, admin_note, handled_by, handled_at, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] failed to load report detail:", error);
    return null;
  }
  if (!row) return null;

  const targetType = row.target_type as AdminReportTargetType;
  const targetId = row.target_id as string;

  const [{ data: reporter }, { data: assignee }, labelByKey] = await Promise.all([
    supabase.from("users").select("name").eq("id", row.reporter_id as string).maybeSingle(),
    row.handled_by
      ? supabase.from("users").select("name").eq("id", row.handled_by as string).maybeSingle()
      : Promise.resolve({ data: null as { name: string } | null }),
    resolveTargetLabels(supabase, [{ target_type: targetType, target_id: targetId }]),
  ]);

  return {
    id: row.id as string,
    reporterId: row.reporter_id as string,
    reporterName: (reporter?.name as string | undefined) ?? "不明なユーザー",
    targetType,
    targetId,
    targetLabel: labelByKey.get(`${targetType}:${targetId}`) ?? "（削除済み）",
    targetHref: targetHref(targetType, targetId),
    status: row.status as AdminReportStatus,
    assigneeName: (assignee?.name as string | undefined) ?? null,
    createdAtLabel: formatDateLabel(row.created_at as string),
    createdAtISO: row.created_at as string,
    reason: row.reason as string,
    adminNote: (row.admin_note as string | null) ?? null,
    handledAtLabel: row.handled_at ? formatDateLabel(row.handled_at as string) : null,
  };
}

export interface UpdateReportStatusResult {
  error: string | null;
}

/**
 * Updates status/admin_note/handled_by/handled_at together -- the only
 * columns abuse_reports actually has for admin handling
 * (017_abuse_reports.sql). Relies on abuse_reports_admin_update RLS
 * (028_admin_policies.sql). handled_by/handled_at are stamped with the
 * calling admin's own id/now(), never trusted from the caller.
 */
export async function updateReportStatus(
  supabase: SupabaseClient,
  reportId: string,
  nextStatus: AdminReportStatus,
  adminNote: string,
): Promise<UpdateReportStatusResult> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return { error: "認証情報の取得に失敗しました。再度ログインしてください。" };
  }

  const { data: before, error: beforeError } = await supabase
    .from("abuse_reports")
    .select("status, admin_note, handled_by, handled_at")
    .eq("id", reportId)
    .maybeSingle();

  if (beforeError || !before) {
    console.error("[admin] failed to load report before status update:", beforeError);
    return { error: "通報情報の取得に失敗しました。" };
  }

  const trimmedNote = adminNote.trim();
  const payload = {
    status: nextStatus,
    admin_note: trimmedNote.length > 0 ? trimmedNote : null,
    handled_by: authUser.id,
    handled_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from("abuse_reports")
    .update(payload)
    .eq("id", reportId)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to update report status:", error);
    return { error: "更新に失敗しました。権限を確認してください。" };
  }

  await writeAdminAuditLog(supabase, {
    actionType: "report_status_update",
    targetType: "abuse_report",
    targetId: reportId,
    beforeData: before,
    afterData: payload,
  });

  return { error: null };
}
