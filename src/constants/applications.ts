/**
 * Engineer Application module content (Japanese).
 * Real Supabase-backed data (see src/lib/engineer/applications.ts) against
 * public.applications. Status values are the exact lowercase DB enum values
 * from chk_applications_status in supabase/migrations/011_applications.sql.
 *
 * Fields with no DB backing in the original UI-only mock (location,
 * working style beyond contract type, timeline history, company info beyond
 * company_profiles, submitted documents) have been dropped rather than
 * fabricated.
 */

// ============================================================
// Page header
// ============================================================

export const APPLICATIONS_PAGE = {
  title: "応募管理",
  description: "応募した求人・案件を確認できます。",
} as const;

// ============================================================
// Status
// ============================================================

export const APPLICATION_STATUS_OPTIONS = [
  { value: "applied", label: "応募済み" },
  { value: "screening", label: "書類選考中" },
  { value: "interview", label: "面接" },
  { value: "accepted", label: "内定" },
  { value: "rejected", label: "不採用" },
  { value: "withdrawn", label: "辞退" },
  { value: "completed", label: "完了" },
] as const;

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  applied: "応募済み",
  screening: "書類選考中",
  interview: "面接",
  accepted: "内定",
  rejected: "不採用",
  withdrawn: "辞退",
  completed: "完了",
};

export const APPLICATION_STATUS_BADGE_STYLES: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700",
  screening: "bg-indigo-50 text-indigo-700",
  interview: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  withdrawn: "bg-gray-100 text-gray-600",
  completed: "bg-teal-50 text-teal-700",
};

/**
 * Statuses an applicant may still withdraw from. 'accepted' is deliberately
 * excluded (RD-2026-001 BR-53/BR-54): once an offer is accepted, the only
 * legal forward transition is accepted -> completed, not a withdrawal. See
 * src/lib/application-status.ts for the full transition graph, enforced at
 * the UI, data, and DB layers alike.
 */
export const WITHDRAWABLE_STATUSES = ["applied", "screening", "interview"] as const;

// ============================================================
// Contract type (shared badge vocabulary with Job Search)
// ============================================================

export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  employment: "就職",
  project: "案件",
  hourly: "時間清算",
};

export const CONTRACT_TYPE_BADGE_STYLES: Record<string, string> = {
  employment: "bg-blue-50 text-blue-700",
  project: "bg-indigo-50 text-primary",
  hourly: "bg-amber-50 text-amber-700",
};

// ============================================================
// Summary cards
// ============================================================

export const SUMMARY_CARDS = [
  { key: "applying", label: "応募中", icon: "send", statuses: ["applied", "screening"] },
  { key: "interviewing", label: "面接中", icon: "messagesSquare", statuses: ["interview"] },
  { key: "offered", label: "内定", icon: "award", statuses: ["accepted"] },
  { key: "closed", label: "完了", icon: "checkCircle2", statuses: ["rejected", "withdrawn"] },
] as const;

// ============================================================
// Filters / sort
// ============================================================

export const SORT_OPTIONS = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const FILTER_LABELS = {
  searchLabel: "応募を検索",
  searchPlaceholder: "求人タイトルで検索",
  statusLabel: "ステータス",
  statusAllLabel: "すべてのステータス",
  sortLabel: "並び替え",
  resetLabel: "条件をリセット",
} as const;

// ============================================================
// Application list / card
// ============================================================

export const APPLICATION_LIST_META = {
  resultsSuffix: "件の応募が見つかりました",
  detailButtonLabel: "詳細を見る",
  withdrawButtonLabel: "取り消す",
  appliedPrefix: "応募日：",
} as const;

// ============================================================
// Loading / error states
// ============================================================

export const LOADING_STATE_LABELS = {
  message: "応募情報を読み込んでいます…",
} as const;

export const ERROR_STATE_LABELS = {
  title: "応募情報の読み込みに失敗しました。",
  description: "しばらくしてから再度お試しください。",
  retryLabel: "再読み込み",
} as const;

// ============================================================
// Empty states
// ============================================================

export const EMPTY_STATE_LABELS = {
  title: "応募した求人・案件はありません。",
  description: "気になる求人・案件を見つけて応募してみましょう。",
  ctaLabel: "求人・案件を探す",
  ctaHref: "/engineer/jobs",
} as const;

export const FILTERED_EMPTY_STATE_LABELS = {
  title: "条件に一致する応募が見つかりませんでした。",
  description: "検索キーワードや絞り込み条件を変更してお試しください。",
  ctaLabel: "条件をリセット",
} as const;

// ============================================================
// Withdraw dialog
// ============================================================

export const WITHDRAW_DIALOG_LABELS = {
  triggerLabel: "取り消す",
  title: "本当に応募を取り消しますか？",
  description: "この操作は取り消せません。応募を取り消すと、選考が終了します。",
  cancelLabel: "キャンセル",
  confirmLabel: "応募を取り消す",
  toastMessage: "応募を取り消しました。",
  errorMessage: "応募の取り消しに失敗しました。しばらくしてから再度お試しください。",
} as const;

// ============================================================
// Application detail
// ============================================================

export const DETAIL_META = {
  backLabel: "応募一覧に戻る",
  backHref: "/engineer/applications",
  summaryTitle: "応募内容",
  companyInfoTitle: "企業情報",
} as const;

export const APPLICATION_SUMMARY_LABELS = {
  positionLabel: "応募職種",
  contractLabel: "契約形態",
  salaryLabel: "給与・単価",
  statusLabel: "ステータス",
  appliedDateLabel: "応募日",
} as const;

export const COMPANY_INFO_LABELS = {
  industryLabel: "業種",
  employeesLabel: "従業員数",
  websiteLabel: "コーポレートサイト",
} as const;

export const APPLICATION_NOT_FOUND_LABELS = {
  title: "応募情報が見つかりませんでした。",
  description: "指定された応募は存在しないか、閲覧権限がありません。",
  ctaLabel: "応募一覧に戻る",
} as const;

export const SIGN_IN_REQUIRED_LABELS = {
  title: "ログインが必要です。",
  description: "応募情報の確認にはログインが必要です。",
  ctaLabel: "ログイン",
  ctaHref: "/login",
} as const;
