/**
 * Admin Reports (通報管理) module labels (Japanese). Real report data comes
 * from src/lib/admin/reports.ts. public.abuse_reports only has a single
 * status column (pending/in_progress/resolved/rejected) and no
 * category/priority columns, so those mock concepts have been dropped
 * rather than fabricated. target_type is only user/company/opportunity --
 * there is no "message" report target in the schema.
 */
import {
  ADMIN_REPORT_STATUS_LABEL,
  ADMIN_REPORT_STATUS_TONE,
  ADMIN_REPORT_TARGET_TYPE_LABEL,
} from "@/lib/admin/reports";

export const ADMIN_REPORTS_PAGE = {
  title: "通報管理",
  description: "ユーザーからの通報を確認できます。",
} as const;

export { ADMIN_REPORT_STATUS_LABEL, ADMIN_REPORT_STATUS_TONE, ADMIN_REPORT_TARGET_TYPE_LABEL };
export const ADMIN_REPORT_STATUS_OPTIONS = ["pending", "in_progress", "resolved", "rejected"] as const;
export const ADMIN_REPORT_TARGET_TYPE_OPTIONS = ["user", "company", "opportunity"] as const;

// ============================================================
// Summary cards
// ============================================================

export const ADMIN_REPORT_SUMMARY_LABELS = {
  total: "全通報",
  pending: "未対応",
  inProgress: "対応中",
  resolved: "解決済み",
} as const;

// ============================================================
// Search / filters
// ============================================================

export const ADMIN_REPORT_SEARCH_LABELS = {
  label: "通報を検索",
  placeholder: "通報者・対象・通報IDで検索",
} as const;

export const ADMIN_REPORT_FILTER_LABELS = {
  title: "絞り込み条件",
  status: "対応状態",
  targetType: "対象種別",
  reportedWithin: "通報日",
  resetLabel: "条件をリセット",
} as const;

export const ADMIN_REPORT_DATE_RANGE_OPTIONS = [
  { label: "指定なし", days: null },
  { label: "7日以内", days: 7 },
  { label: "30日以内", days: 30 },
  { label: "90日以内", days: 90 },
] as const;

export interface AdminReportFilterState {
  statuses: string[];
  targetTypes: string[];
  reportedWithinDays: number | null;
}

export const DEFAULT_ADMIN_REPORT_FILTER_STATE: AdminReportFilterState = {
  statuses: [],
  targetTypes: [],
  reportedWithinDays: null,
};

// ============================================================
// Table
// ============================================================

export const ADMIN_REPORT_TABLE_COLUMNS = [
  "通報ID",
  "通報者",
  "対象",
  "状態",
  "通報日",
  "対応者",
] as const;

export const ADMIN_REPORT_ACTION_LABELS = {
  viewDetails: "詳細を見る",
  changeStatus: "対応状態を変更",
} as const;

export const ADMIN_REPORT_RESULTS_META = {
  resultsSuffix: "件の通報",
} as const;

// ============================================================
// Detail page section labels
// ============================================================

export const ADMIN_REPORT_DETAIL_SECTIONS = {
  content: "通報内容",
  reporter: "通報者",
  target: "対象",
  adminNote: "管理者メモ",
} as const;

// ============================================================
// Status update form (detail page)
// ============================================================

export const ADMIN_REPORT_STATUS_FORM_LABELS = {
  title: "対応状態を更新",
  description: "対応状態と管理者メモを更新します。対応者と対応日時は自動的に記録されます。",
  statusLabel: "対応状態",
  noteLabel: "管理者メモ",
  notePlaceholder: "対応内容や判断理由を入力してください（任意）",
  submitLabel: "更新する",
  successMessage: "通報の対応状態を更新しました。",
  errorFallback: "更新に失敗しました。もう一度お試しください。",
} as const;

export const ADMIN_REPORT_NOT_FOUND = {
  title: "通報が見つかりませんでした。",
  description: "指定された通報IDは存在しないか、削除された可能性があります。",
  ctaLabel: "通報一覧に戻る",
  ctaHref: "/admin/reports",
} as const;
