/**
 * Admin Companies management module labels (Japanese). Real company data
 * comes from src/lib/admin/companies.ts. company_profiles has no
 * review/approval-status column in the schema, so there is no 審査中/承認済み
 * workflow here -- only the owning account's real ACTIVE/SUSPENDED/WITHDRAWN
 * usage status is manageable.
 */
import { ADMIN_COMPANY_SIZE_LABEL } from "@/lib/admin/companies";
import { ADMIN_USER_STATUS_LABEL, ADMIN_USER_STATUS_TONE, ADMIN_USER_STATUS_OPTIONS } from "@/constants/admin-users";
import type { AdminUserStatus } from "@/lib/admin/users";

// ============================================================
// Page meta
// ============================================================

export const ADMIN_COMPANIES_PAGE = {
  title: "企業管理",
  description: "登録企業のプロフィールと利用状況を管理できます。",
} as const;

export { ADMIN_COMPANY_SIZE_LABEL };
export const ADMIN_COMPANY_SIZE_OPTIONS = Object.keys(ADMIN_COMPANY_SIZE_LABEL);

export const ADMIN_COMPANY_USAGE_STATUS_LABEL = ADMIN_USER_STATUS_LABEL;
export const ADMIN_COMPANY_USAGE_STATUS_TONE = ADMIN_USER_STATUS_TONE;
export const ADMIN_COMPANY_USAGE_STATUS_OPTIONS = ADMIN_USER_STATUS_OPTIONS;

// ============================================================
// Summary cards
// ============================================================

export const ADMIN_COMPANY_SUMMARY_LABELS = {
  total: "登録企業",
  active: "利用中",
  suspended: "利用停止中",
  newThisMonth: "今月の新規企業",
} as const;

// ============================================================
// Search / filters
// ============================================================

export const ADMIN_COMPANY_SEARCH_LABELS = {
  label: "企業を検索",
  placeholder: "企業名・担当者名・企業IDで検索",
} as const;

export const ADMIN_COMPANY_FILTER_LABELS = {
  title: "絞り込み条件",
  usageStatus: "利用状態",
  industry: "業種",
  companySize: "企業規模",
  registeredWithin: "登録日",
  resetLabel: "条件をリセット",
} as const;

export const ADMIN_COMPANY_DATE_RANGE_OPTIONS = [
  { label: "指定なし", days: null },
  { label: "7日以内", days: 7 },
  { label: "30日以内", days: 30 },
  { label: "90日以内", days: 90 },
] as const;

export interface AdminCompanyFilterState {
  usageStatuses: AdminUserStatus[];
  industries: string[];
  companySizes: string[];
  registeredWithinDays: number | null;
}

export const DEFAULT_ADMIN_COMPANY_FILTER_STATE: AdminCompanyFilterState = {
  usageStatuses: [],
  industries: [],
  companySizes: [],
  registeredWithinDays: null,
};

// ============================================================
// Table / actions
// ============================================================

export const ADMIN_COMPANY_TABLE_COLUMNS = [
  "企業名",
  "業種",
  "担当者",
  "求人数",
  "登録日",
  "利用状態",
  "操作",
] as const;

export const ADMIN_COMPANY_ACTION_LABELS = {
  viewDetails: "詳細を見る",
  suspend: "利用停止",
  reinstate: "利用再開",
} as const;

export const ADMIN_COMPANY_RESULTS_META = {
  resultsSuffix: "件の企業",
} as const;

export const ADMIN_COMPANY_STATUS_ACTION_PENDING_NOTE =
  "この操作はユーザー管理画面から行えます。";

// ============================================================
// Detail page section labels
// ============================================================

export const ADMIN_COMPANY_DETAIL_SECTIONS = {
  basicInfo: "企業基本情報",
  contactInfo: "担当者情報",
  profile: "企業プロフィール",
  jobs: "掲載した求人・案件",
} as const;

export const ADMIN_COMPANY_NOT_FOUND = {
  title: "企業が見つかりませんでした。",
  description: "指定された企業IDは存在しないか、削除された可能性があります。",
  ctaLabel: "企業一覧に戻る",
  ctaHref: "/admin/companies",
} as const;
