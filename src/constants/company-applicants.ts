/**
 * Company applicant management module content (Japanese).
 * Real Supabase-backed (see src/lib/company/applicants.ts) against
 * public.applications / opportunities / users / engineer_profiles /
 * user_skills / user_qualifications / skill_assessment_attempts
 * (011_applications.sql, 025_application_policies.sql,
 * 032_company_applicant_visibility_policies.sql).
 */
import type { ApplicationStatus } from "@/lib/company/applicants";

// ============================================================
// Page meta
// ============================================================

export const APPLICANTS_PAGE = {
  title: "応募者管理",
  description: "求人・案件への応募者を確認・管理できます。",
} as const;

// ============================================================
// Status — the exact 6 values chk_applications_status allows
// (011_applications.sql). No other values exist anywhere.
// ============================================================

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "applied",
  "screening",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
  "completed",
] as const;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "応募受付",
  screening: "書類選考中",
  interview: "面接",
  accepted: "内定",
  rejected: "不採用",
  withdrawn: "辞退",
  completed: "完了",
};

export const APPLICATION_STATUS_BADGE_STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-blue-50 text-blue-700",
  screening: "bg-indigo-50 text-indigo-700",
  interview: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  withdrawn: "bg-gray-100 text-gray-600",
  completed: "bg-teal-50 text-teal-700",
};

export const EXPERIENCE_FILTER_OPTIONS = [
  { label: "指定なし", years: null },
  { label: "1年以上", years: 1 },
  { label: "3年以上", years: 3 },
  { label: "5年以上", years: 5 },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "experience", label: "経験年数順" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

// ============================================================
// Summary cards
// ============================================================

export const SUMMARY_CARDS = [
  {
    key: "total",
    label: "応募総数",
    icon: "users",
    statuses: null as readonly ApplicationStatus[] | null,
  },
  {
    key: "screening",
    label: "書類選考",
    icon: "fileText",
    statuses: ["screening"] as readonly ApplicationStatus[],
  },
  {
    key: "interviewing",
    label: "面接中",
    icon: "messagesSquare",
    statuses: ["interview"] as readonly ApplicationStatus[],
  },
  {
    key: "accepted",
    label: "内定",
    icon: "userCheck",
    statuses: ["accepted"] as readonly ApplicationStatus[],
  },
] as const;

// ============================================================
// Search / filters
// ============================================================

export const SEARCH_LABELS = {
  label: "応募者を検索",
  placeholder: "応募者を検索",
} as const;

export const FILTER_LABELS = {
  title: "絞り込み条件",
  statusLabel: "ステータス",
  statusAllLabel: "すべてのステータス",
  appliedJobLabel: "応募求人",
  appliedJobAllLabel: "すべての求人",
  experienceLabel: "経験年数",
  locationLabel: "勤務地",
  locationAllLabel: "すべての勤務地",
  sortLabel: "並び替え",
  resetLabel: "条件をリセット",
} as const;

export const APPLICANT_LIST_META = {
  resultsSuffix: "名の応募者が見つかりました",
  detailButtonLabel: "詳細を見る",
  appliedPrefix: "応募日：",
} as const;

export const EMPTY_STATE_LABELS = {
  title: "応募者はまだいません。",
  description: "求人・案件を公開すると、ここに応募者が表示されます。",
} as const;

export const FILTERED_EMPTY_STATE_LABELS = {
  title: "条件に一致する応募者が見つかりませんでした。",
  description: "検索キーワードや絞り込み条件を変更してお試しください。",
  ctaLabel: "条件をリセット",
} as const;

// ============================================================
// Applicant detail — section labels
// ============================================================

export const APPLICANT_DETAIL_META = {
  backLabel: "応募者一覧に戻る",
  backHref: "/company/applicants",
  profileSummaryTitle: "プロフィール概要",
  skillsTitle: "技術スキル",
  qualificationsTitle: "資格",
  humanSkillTitle: "ヒューマンスキル",
  businessSkillTitle: "ビジネススキル",
  changeStatusLabel: "次の選考段階に進める",
  rejectLabel: "不採用にする",
  noSkillsMessage: "スキル情報は登録されていません。",
  noQualificationsMessage: "資格情報は登録されていません。",
  notAssessedLabel: "未診断",
} as const;

// ============================================================
// Status change / reject actions — feedback + dialogs
// ============================================================

export const STATUS_ACTION_LABELS = {
  updating: "更新中…",
  updateSuccess: "ステータスを変更しました。",
  updateError: "ステータスの変更に失敗しました。しばらくしてから再度お試しください。",
} as const;

export const STATUS_CHANGE_DIALOG_LABELS = {
  title: "選考ステータスを変更しますか？",
  descriptionPrefix: "ステータスを次の段階に進めます：",
  cancelLabel: "キャンセル",
  confirmLabel: "変更する",
} as const;

export const REJECT_DIALOG_LABELS = {
  title: "この応募者を不採用にしますか？",
  description: "この操作は取り消せません。",
  cancelLabel: "キャンセル",
  confirmLabel: "不採用にする",
} as const;
