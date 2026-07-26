/**
 * Admin Users management module labels (Japanese). Real user data comes from
 * src/lib/admin/users.ts -- this file only keeps UI chrome: labels, filter
 * option lists, table columns, dialog copy.
 */
import type { AdminUserRole, AdminUserStatus } from "@/lib/admin/users";
import { ADMIN_USER_ROLE_LABEL, ADMIN_USER_STATUS_LABEL } from "@/lib/admin/users";

// ============================================================
// Page meta
// ============================================================

export const ADMIN_USERS_PAGE = {
  title: "ユーザー管理",
  description: "エンジニア・企業担当者・管理者のアカウントを管理できます。",
} as const;

// ============================================================
// Style maps (keyed by real role/status values)
// ============================================================

export const ADMIN_USER_ROLE_STYLES: Record<AdminUserRole, string> = {
  ENGINEER: "bg-indigo-50 text-indigo-700",
  INSTRUCTOR: "bg-teal-50 text-teal-700",
  COMPANY: "bg-blue-50 text-blue-700",
  ADMIN: "bg-violet-50 text-violet-700",
};

export const ADMIN_USER_STATUS_TONE: Record<AdminUserStatus, "positive" | "negative" | "warning"> = {
  ACTIVE: "positive",
  SUSPENDED: "negative",
  WITHDRAWN: "warning",
};

export const ADMIN_USER_ROLE_OPTIONS: AdminUserRole[] = ["ENGINEER", "INSTRUCTOR", "COMPANY", "ADMIN"];
export const ADMIN_USER_STATUS_OPTIONS: AdminUserStatus[] = ["ACTIVE", "SUSPENDED", "WITHDRAWN"];

// ============================================================
// Summary cards
// ============================================================

export const ADMIN_USER_SUMMARY_LABELS = {
  total: "全ユーザー",
  engineers: "エンジニア",
  companyStaff: "企業担当者",
  admins: "管理者",
  suspended: "利用停止中",
  newThisMonth: "今月の新規登録",
} as const;

// ============================================================
// Search / filters
// ============================================================

export const ADMIN_USER_SEARCH_LABELS = {
  label: "ユーザーを検索",
  placeholder: "氏名・メールアドレス・ユーザーID・企業名で検索",
} as const;

export const ADMIN_USER_FILTER_LABELS = {
  title: "絞り込み条件",
  role: "ロール",
  accountStatus: "アカウント状態",
  registeredWithin: "登録日",
  resetLabel: "条件をリセット",
} as const;

export const ADMIN_USER_DATE_RANGE_OPTIONS = [
  { label: "指定なし", days: null },
  { label: "7日以内", days: 7 },
  { label: "30日以内", days: 30 },
  { label: "90日以内", days: 90 },
] as const;

export interface AdminUserFilterState {
  roles: AdminUserRole[];
  statuses: AdminUserStatus[];
  registeredWithinDays: number | null;
}

export const DEFAULT_ADMIN_USER_FILTER_STATE: AdminUserFilterState = {
  roles: [],
  statuses: [],
  registeredWithinDays: null,
};

// ============================================================
// Table / actions
// ============================================================

export const ADMIN_USER_TABLE_COLUMNS = [
  "ユーザー",
  "ロール",
  "所属企業",
  "登録日",
  "状態",
  "操作",
] as const;

export const ADMIN_USER_ACTION_LABELS = {
  viewDetails: "詳細を見る",
  suspend: "利用停止",
  reinstate: "利用再開",
} as const;

export const ADMIN_USER_RESULTS_META = {
  resultsSuffix: "件のユーザー",
} as const;

export const ADMIN_USER_STATUS_DIALOG_LABELS = {
  suspendTitle: "本当にこのユーザーを利用停止にしますか？",
  suspendDescription: "利用停止にすると、ユーザーはログインできなくなります。",
  suspendConfirmLabel: "利用停止にする",
  reinstateTitle: "このユーザーの利用を再開しますか？",
  reinstateDescription: "利用を再開すると、ユーザーは再びログインできるようになります。",
  reinstateConfirmLabel: "利用再開する",
} as const;

export const ADMIN_USER_TOAST_MESSAGES = {
  suspended: "ユーザーを利用停止にしました。",
  reinstated: "ユーザーの利用を再開しました。",
} as const;

export const ADMIN_USER_STATUS_ERROR_FALLBACK = "操作に失敗しました。もう一度お試しください。";

// ============================================================
// Detail page section labels
// ============================================================

export const ADMIN_USER_DETAIL_SECTIONS = {
  basicInfo: "基本情報",
  profileInfo: "プロフィール情報",
  registrationStatus: "登録状況",
  messageHistory: "メッセージ履歴",
} as const;

export const ADMIN_USER_NOT_FOUND = {
  title: "ユーザーが見つかりませんでした。",
  description: "指定されたユーザーIDは存在しないか、削除された可能性があります。",
  ctaLabel: "ユーザー一覧に戻る",
  ctaHref: "/admin/users",
} as const;

export { ADMIN_USER_ROLE_LABEL, ADMIN_USER_STATUS_LABEL };
export type { AdminUserRole, AdminUserStatus };
