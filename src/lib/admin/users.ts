import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAdminAuditLog } from "@/lib/admin/audit";

/** public.users.role (002_users.sql). */
export type AdminUserRole = "ENGINEER" | "INSTRUCTOR" | "COMPANY" | "ADMIN";
/** public.users.status (002_users.sql: chk_users_status). */
export type AdminUserStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN";

export const ADMIN_USER_ROLE_LABEL: Record<AdminUserRole, string> = {
  ENGINEER: "エンジニア",
  INSTRUCTOR: "インストラクター",
  COMPANY: "企業担当者",
  ADMIN: "管理者",
};

export const ADMIN_USER_STATUS_LABEL: Record<AdminUserStatus, string> = {
  ACTIVE: "有効",
  SUSPENDED: "利用停止中",
  WITHDRAWN: "退会済み",
};

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  companyName: string | null;
  createdAtLabel: string;
  createdAtISO: string;
  avatarInitials: string;
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateTimeLabel(iso: string): string {
  const date = new Date(iso);
  return `${formatDateLabel(iso)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const LIST_CAP = 1000;

/**
 * Full user list for the admin console, real data only. Fetched in one
 * capped batch (LIST_CAP) and filtered/paginated client-side by
 * AdminUserList, mirroring the existing UI's interaction model -- fine at
 * current data volumes, flagged as a scale limitation for later.
 */
export async function listAdminUsers(supabase: SupabaseClient): Promise<AdminUserListItem[]> {
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email, role, status, created_at")
    .order("created_at", { ascending: false })
    .limit(LIST_CAP);

  if (error) {
    console.error("[admin] failed to list users:", error);
    return [];
  }
  if (!users || users.length === 0) return [];

  const companyIds = users.filter((u) => u.role === "COMPANY").map((u) => u.id as string);
  const { data: companyProfiles } =
    companyIds.length > 0
      ? await supabase.from("company_profiles").select("id, company_name").in("id", companyIds)
      : { data: [] as { id: string; company_name: string }[] };
  const companyNameById = new Map(
    (companyProfiles ?? []).map((row) => [row.id as string, row.company_name as string]),
  );

  return users.map((row) => {
    const name = row.name as string;
    return {
      id: row.id as string,
      name,
      email: row.email as string,
      role: row.role as AdminUserRole,
      status: row.status as AdminUserStatus,
      companyName: companyNameById.get(row.id as string) ?? null,
      createdAtLabel: formatDateLabel(row.created_at as string),
      createdAtISO: row.created_at as string,
      avatarInitials: name.charAt(0),
    };
  });
}

export interface AdminUserActivityEntry {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  dateLabel: string;
}

export interface AdminUserMessageEntry {
  id: string;
  counterpartName: string;
  preview: string;
  dateLabel: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  prefecture: string | null;
  yearsOfExperience: number | null;
  workStyle: string | null;
  selfPr: string | null;
  isPublic: boolean | null;
  activityLabel: string;
  activity: AdminUserActivityEntry[];
  recentMessages: AdminUserMessageEntry[];
}

const APPLICATION_STATUS_LABEL: Record<string, string> = {
  applied: "応募済み",
  screening: "書類選考中",
  interview: "面接",
  accepted: "内定",
  rejected: "不採用",
  withdrawn: "辞退",
  completed: "完了",
};

const OPPORTUNITY_STATUS_LABEL: Record<string, string> = {
  draft: "下書き",
  published: "公開中",
  closed: "終了",
};

export async function getAdminUserDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<AdminUserDetail | null> {
  const { data: userRow, error } = await supabase
    .from("users")
    .select("id, name, email, role, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] failed to load user detail:", error);
    return null;
  }
  if (!userRow) return null;

  const role = userRow.role as AdminUserRole;
  const name = userRow.name as string;

  let companyName: string | null = null;
  let prefecture: string | null = null;
  let yearsOfExperience: number | null = null;
  let workStyle: string | null = null;
  let selfPr: string | null = null;
  let isPublic: boolean | null = null;

  if (role === "COMPANY") {
    const { data } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", id)
      .maybeSingle();
    companyName = (data?.company_name as string | undefined) ?? null;
  } else if (role === "ENGINEER" || role === "INSTRUCTOR") {
    const table = role === "ENGINEER" ? "engineer_profiles" : "instructor_profiles";
    const { data } = await supabase
      .from(table)
      .select("prefecture, years_of_experience, work_style, self_pr, is_public")
      .eq("id", id)
      .maybeSingle();
    prefecture = (data?.prefecture as string | undefined) ?? null;
    yearsOfExperience = (data?.years_of_experience as number | undefined) ?? null;
    workStyle = (data?.work_style as string | undefined) ?? null;
    selfPr = (data?.self_pr as string | undefined) ?? null;
    isPublic = (data?.is_public as boolean | undefined) ?? null;
  }

  let activityLabel = "";
  let activity: AdminUserActivityEntry[] = [];

  if (role === "ENGINEER" || role === "INSTRUCTOR") {
    activityLabel = "応募履歴";
    const { data: applications } = await supabase
      .from("applications")
      .select("id, status, applied_at, opportunity_id")
      .eq("applicant_id", id)
      .order("applied_at", { ascending: false })
      .limit(10);

    const oppIds = [...new Set((applications ?? []).map((a) => a.opportunity_id as string))];
    const { data: opportunities } =
      oppIds.length > 0
        ? await supabase.from("opportunities").select("id, title, posted_by").in("id", oppIds)
        : { data: [] as { id: string; title: string; posted_by: string }[] };
    const posterIds = [...new Set((opportunities ?? []).map((o) => o.posted_by as string))];
    const { data: posterCompanies } =
      posterIds.length > 0
        ? await supabase.from("company_profiles").select("id, company_name").in("id", posterIds)
        : { data: [] as { id: string; company_name: string }[] };
    const companyNameByUserId = new Map(
      (posterCompanies ?? []).map((row) => [row.id as string, row.company_name as string]),
    );
    const oppById = new Map((opportunities ?? []).map((row) => [row.id as string, row]));

    activity = (applications ?? []).map((row) => {
      const opp = oppById.get(row.opportunity_id as string);
      return {
        id: row.id as string,
        title: opp?.title ?? "（求人情報なし）",
        subtitle: opp ? (companyNameByUserId.get(opp.posted_by as string) ?? "") : "",
        statusLabel: APPLICATION_STATUS_LABEL[row.status as string] ?? (row.status as string),
        dateLabel: formatDateLabel(row.applied_at as string),
      };
    });
  } else if (role === "COMPANY") {
    activityLabel = "掲載した求人・案件";
    const { data: opportunities } = await supabase
      .from("opportunities")
      .select("id, title, status, created_at")
      .eq("posted_by", id)
      .order("created_at", { ascending: false })
      .limit(10);

    activity = (opportunities ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      subtitle: "",
      statusLabel: OPPORTUNITY_STATUS_LABEL[row.status as string] ?? (row.status as string),
      dateLabel: formatDateLabel(row.created_at as string),
    }));
  }

  let recentMessages: AdminUserMessageEntry[] = [];
  if (role === "ENGINEER" || role === "INSTRUCTOR" || role === "COMPANY") {
    const column = role === "COMPANY" ? "company_user_id" : "engineer_id";
    const { data: rooms } = await supabase
      .from("chat_rooms")
      .select("id, engineer_id, company_user_id, updated_at")
      .eq(column, id)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (rooms && rooms.length > 0) {
      const counterpartIds = [
        ...new Set(
          rooms.map((r) => (role === "COMPANY" ? (r.engineer_id as string) : (r.company_user_id as string))),
        ),
      ];
      const { data: counterparts } = await supabase
        .from("users")
        .select("id, name")
        .in("id", counterpartIds);
      const nameById = new Map((counterparts ?? []).map((row) => [row.id as string, row.name as string]));

      const roomIds = rooms.map((r) => r.id as string);
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("chat_room_id, body, sent_at")
        .in("chat_room_id", roomIds)
        .order("sent_at", { ascending: false });

      const lastByRoom = new Map<string, { body: string; sent_at: string }>();
      for (const m of lastMessages ?? []) {
        const roomId = m.chat_room_id as string;
        if (!lastByRoom.has(roomId)) {
          lastByRoom.set(roomId, { body: m.body as string, sent_at: m.sent_at as string });
        }
      }

      recentMessages = rooms.map((room) => {
        const counterpartId = role === "COMPANY" ? (room.engineer_id as string) : (room.company_user_id as string);
        const last = lastByRoom.get(room.id as string);
        return {
          id: room.id as string,
          counterpartName: nameById.get(counterpartId) ?? "不明なユーザー",
          preview: last?.body ?? "",
          dateLabel: last ? formatDateTimeLabel(last.sent_at) : formatDateTimeLabel(room.updated_at as string),
        };
      });
    }
  }

  return {
    id: userRow.id as string,
    name,
    email: userRow.email as string,
    role,
    status: userRow.status as AdminUserStatus,
    companyName,
    createdAtLabel: formatDateLabel(userRow.created_at as string),
    createdAtISO: userRow.created_at as string,
    avatarInitials: name.charAt(0),
    prefecture,
    yearsOfExperience,
    workStyle,
    selfPr,
    isPublic,
    activityLabel,
    activity,
    recentMessages,
  };
}

/** Number of ADMIN-role users currently ACTIVE — used to gate the "last admin" protection in the UI (RD-2026-001 BR-104). */
export async function countActiveAdmins(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "ADMIN")
    .eq("status", "ACTIVE");

  if (error) {
    console.error("[admin] failed to count active admins:", error);
    return 0;
  }
  return count ?? 0;
}

export interface UpdateUserStatusResult {
  error: string | null;
}

/**
 * Suspend/reinstate toggle. Relies entirely on users_admin_update RLS
 * (029_remaining_policies.sql) for authorization -- no explicit role check
 * here, matching the established client-side mutation pattern (see
 * src/lib/company/applicants.ts updateApplicationStatus). WITHDRAWN users
 * are not valid targets: chk_users_withdrawal_consistency
 * (002_users.sql) requires deleted_at to move together with that status,
 * which this function never touches, so the DB itself will reject the
 * transition -- surfaced here as a plain Japanese error rather than a raw
 * Postgres message.
 */
export async function updateUserStatus(
  supabase: SupabaseClient,
  userId: string,
  nextStatus: "ACTIVE" | "SUSPENDED",
): Promise<UpdateUserStatusResult> {
  const { data: before, error: beforeError } = await supabase
    .from("users")
    .select("status, role")
    .eq("id", userId)
    .maybeSingle();

  if (beforeError || !before) {
    console.error("[admin] failed to load user before status update:", beforeError);
    return { error: "ユーザー情報の取得に失敗しました。" };
  }
  if (before.status === "WITHDRAWN") {
    return { error: "退会済みのユーザーは操作できません。" };
  }
  if (before.status === nextStatus) {
    return { error: null };
  }

  // RD-2026-001 BR-103/BR-104: an admin may not suspend themself, and the
  // last remaining ACTIVE admin may not be suspended by anyone. This is the
  // application-layer check for a clear, specific error message; the DB also
  // enforces both rules via trg_users_admin_status_protection (055) so a
  // direct API call bypassing this function is still blocked.
  if (nextStatus === "SUSPENDED" && before.role === "ADMIN") {
    const {
      data: { user: actingUser },
    } = await supabase.auth.getUser();

    if (actingUser?.id === userId) {
      return { error: "自分自身のアカウントを停止することはできません。" };
    }

    if (before.status === "ACTIVE") {
      const { count, error: countError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "ADMIN")
        .eq("status", "ACTIVE")
        .neq("id", userId);

      if (countError) {
        console.error("[admin] failed to count active admins:", countError);
        return { error: "更新に失敗しました。しばらくしてから再度お試しください。" };
      }
      if ((count ?? 0) === 0) {
        return { error: "有効な管理者が1名のみのため、このアカウントを停止できません。" };
      }
    }
  }

  const { data: updated, error } = await supabase
    .from("users")
    .update({ status: nextStatus })
    .eq("id", userId)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    // A blocked RLS UPDATE returns 0 rows with no PostgREST error, not an
    // exception -- checked explicitly here so a silently-rejected write is
    // never reported to the admin as a success.
    console.error("[admin] failed to update user status:", error);
    return { error: "更新に失敗しました。権限を確認してください。" };
  }

  await writeAdminAuditLog(supabase, {
    actionType: nextStatus === "SUSPENDED" ? "user_suspend" : "user_reinstate",
    targetType: "user",
    targetId: userId,
    beforeData: { status: before.status },
    afterData: { status: nextStatus },
  });

  return { error: null };
}
