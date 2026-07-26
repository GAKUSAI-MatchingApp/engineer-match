import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminApprovalItem } from "@/constants/admin";

/** public.abuse_reports.status -> UI label (017_abuse_reports.sql). */
const REPORT_STATUS_LABEL: Record<string, string> = {
  pending: "未対応",
  in_progress: "対応中",
};

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export interface AdminSummaryCardData {
  id: string;
  label: string;
  value: string;
  icon: string;
}

export interface AdminActivityLogItem {
  id: string;
  title: string;
  description: string;
  actor: string;
  dateLabel: string;
}

export interface AdminDashboardData {
  summaryCards: AdminSummaryCardData[];
  pendingApprovals: AdminApprovalItem[];
  recentActivity: AdminActivityLogItem[];
}

/**
 * Real dashboard data only. No trend/% comparisons (no historical snapshot
 * table exists), no system/infra health (not app data), no union of
 * fabricated event types for "recent activity" -- that section is sourced
 * strictly from admin_audit_logs, written via the admin_write_audit_log()
 * SECURITY DEFINER function (051_admin_audit_log_function.sql).
 */
export async function getAdminDashboardData(supabase: SupabaseClient): Promise<AdminDashboardData> {
  const todayStartIso = new Date(new Date().toDateString()).toISOString();

  const [
    engineerCount,
    companyCount,
    publishedOpportunityCount,
    applicationCount,
    pendingReportCount,
    newUsersTodayCount,
    pendingReportsResult,
    recentActivityResult,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "ENGINEER"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "COMPANY"),
    supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase
      .from("abuse_reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "in_progress"]),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", todayStartIso),
    supabase
      .from("abuse_reports")
      .select("id, reason, status, reporter_id, created_at")
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("admin_audit_logs")
      .select("id, action_type, target_type, reason, admin_user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const reportRows = pendingReportsResult.data ?? [];
  const reporterIds = [...new Set(reportRows.map((row) => row.reporter_id as string))];
  const { data: reporters } =
    reporterIds.length > 0
      ? await supabase.from("users").select("id, name").in("id", reporterIds)
      : { data: [] as { id: string; name: string }[] };
  const reporterNameById = new Map((reporters ?? []).map((row) => [row.id as string, row.name as string]));

  const pendingApprovals: AdminApprovalItem[] = reportRows.map((row) => ({
    id: row.id as string,
    type: "通報対応待ち",
    title: (row.reason as string).slice(0, 60),
    submittedBy: reporterNameById.get(row.reporter_id as string) ?? "不明なユーザー",
    dateLabel: formatDateLabel(row.created_at as string),
    status: REPORT_STATUS_LABEL[row.status as string] ?? (row.status as string),
    detailsHref: `/admin/reports/${row.id}`,
  }));

  const activityRows = recentActivityResult.data ?? [];
  const adminIds = [...new Set(activityRows.map((row) => row.admin_user_id as string))];
  const { data: admins } =
    adminIds.length > 0
      ? await supabase.from("users").select("id, name").in("id", adminIds)
      : { data: [] as { id: string; name: string }[] };
  const adminNameById = new Map((admins ?? []).map((row) => [row.id as string, row.name as string]));

  const recentActivity: AdminActivityLogItem[] = activityRows.map((row) => ({
    id: row.id as string,
    title: `${row.action_type as string} (${row.target_type as string})`,
    description: (row.reason as string | null) ?? "",
    actor: adminNameById.get(row.admin_user_id as string) ?? "管理者",
    dateLabel: formatDateLabel(row.created_at as string),
  }));

  return {
    summaryCards: [
      {
        id: "engineers",
        label: "登録エンジニア数",
        value: `${engineerCount.count ?? 0}人`,
        icon: "userRound",
      },
      {
        id: "companies",
        label: "登録企業数",
        value: `${companyCount.count ?? 0}社`,
        icon: "building2",
      },
      {
        id: "openJobs",
        label: "公開中求人・案件数",
        value: `${publishedOpportunityCount.count ?? 0}件`,
        icon: "briefcase",
      },
      {
        id: "applications",
        label: "応募総数",
        value: `${applicationCount.count ?? 0}件`,
        icon: "send",
      },
      {
        id: "openReports",
        label: "未対応通報数",
        value: `${pendingReportCount.count ?? 0}件`,
        icon: "shieldAlert",
      },
      {
        id: "newToday",
        label: "本日の新規登録数",
        value: `${newUsersTodayCount.count ?? 0}人`,
        icon: "userPlus",
      },
    ],
    pendingApprovals,
    recentActivity,
  };
}
