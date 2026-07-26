/**
 * Admin Applications management module labels (Japanese). Real application
 * data comes from src/lib/admin/applications.ts. This area is read-only by
 * design -- admin never impersonates the company or applicant, so there is
 * no status-change control here, only inspection.
 */
import {
  ADMIN_APPLICATION_STATUS_LABEL,
  ADMIN_APPLICATION_STATUS_TONE,
} from "@/lib/admin/applications";
import { ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL } from "@/lib/admin/opportunities";

export const ADMIN_APPLICATIONS_PAGE = {
  title: "応募管理",
  description: "プラットフォーム全体の応募状況を確認できます。",
} as const;

export { ADMIN_APPLICATION_STATUS_LABEL, ADMIN_APPLICATION_STATUS_TONE, ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL };
export const ADMIN_APPLICATION_STATUS_OPTIONS = [
  "applied",
  "screening",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
  "completed",
] as const;
export const ADMIN_APPLICATION_CONTRACT_TYPE_OPTIONS = ["employment", "project", "hourly", "training"] as const;

// ============================================================
// Summary cards
// ============================================================

export const ADMIN_APPLICATION_SUMMARY_LABELS = {
  total: "全応募",
  screening: "選考中",
  interview: "面接",
  accepted: "内定",
  rejected: "不採用",
  completed: "完了",
} as const;

// ============================================================
// Search / filters
// ============================================================

export const ADMIN_APPLICATION_SEARCH_LABELS = {
  label: "応募を検索",
  placeholder: "応募者名・企業名・求人・案件名・応募IDで検索",
} as const;

export const ADMIN_APPLICATION_FILTER_LABELS = {
  title: "絞り込み条件",
  status: "応募状態",
  contractType: "サービス区分",
  appliedWithin: "応募日",
  resetLabel: "条件をリセット",
} as const;

export const ADMIN_APPLICATION_DATE_RANGE_OPTIONS = [
  { label: "指定なし", days: null },
  { label: "7日以内", days: 7 },
  { label: "30日以内", days: 30 },
  { label: "90日以内", days: 90 },
] as const;

export interface AdminApplicationFilterState {
  statuses: string[];
  contractTypes: string[];
  appliedWithinDays: number | null;
}

export const DEFAULT_ADMIN_APPLICATION_FILTER_STATE: AdminApplicationFilterState = {
  statuses: [],
  contractTypes: [],
  appliedWithinDays: null,
};

// ============================================================
// Table
// ============================================================

export const ADMIN_APPLICATION_TABLE_COLUMNS = [
  "応募者",
  "求人・案件",
  "企業",
  "応募日",
  "現在の状態",
  "最終更新",
  "操作",
] as const;

export const ADMIN_APPLICATION_ACTION_LABELS = {
  viewDetails: "詳細を見る",
} as const;

export const ADMIN_APPLICATION_RESULTS_META = {
  resultsSuffix: "件の応募",
} as const;

// ============================================================
// Detail page section labels
// ============================================================

export const ADMIN_APPLICATION_DETAIL_SECTIONS = {
  applicantInfo: "応募者情報",
  opportunityInfo: "求人・案件情報",
  messages: "メッセージ概要",
} as const;

export const ADMIN_APPLICATION_NOT_FOUND = {
  title: "応募情報が見つかりませんでした。",
  description: "指定された応募IDは存在しないか、削除された可能性があります。",
  ctaLabel: "応募一覧に戻る",
  ctaHref: "/admin/applications",
} as const;
