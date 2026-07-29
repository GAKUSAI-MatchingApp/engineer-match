/**
 * Admin Opportunities (求人・案件) management module labels (Japanese). Real
 * opportunity data comes from src/lib/admin/opportunities.ts. The real
 * status enum is draft/published/closed (005_opportunities.sql) -- there is
 * no separate "under review" state, so the mock's 4-state publication status
 * has been narrowed to match the schema.
 */
import {
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL,
  ADMIN_OPPORTUNITY_STATUS_LABEL,
  type AdminOpportunityContractType,
  type AdminOpportunitySide,
} from "@/lib/admin/opportunities";

// ============================================================
// Page meta
// ============================================================

export const ADMIN_OPPORTUNITIES_PAGE = {
  title: "求人・案件管理",
  description: "就職・案件・時間精算・研修の求人・案件を一括で管理できます。",
} as const;

export { ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL, ADMIN_OPPORTUNITY_STATUS_LABEL };
export const ADMIN_OPPORTUNITY_CONTRACT_TYPE_OPTIONS = ["employment", "project", "hourly", "training"] as const;
export const ADMIN_OPPORTUNITY_STATUS_OPTIONS = ["draft", "published", "closed"] as const;

export const ADMIN_OPPORTUNITY_SIDE_LABEL: Record<AdminOpportunitySide, string> = {
  ENGINEER: "エンジニア向け",
  TRAINING: "研修",
};

export const ADMIN_OPPORTUNITY_CONTRACT_TYPE_BADGE_STYLES: Record<
  AdminOpportunityContractType,
  string
> = {
  employment: "bg-indigo-50 text-indigo-700",
  project: "bg-violet-50 text-violet-700",
  hourly: "bg-sky-50 text-sky-700",
  training: "bg-teal-50 text-teal-700",
};

export const ADMIN_OPPORTUNITY_WORK_STYLE_LABEL: Record<string, string> = {
  REMOTE: "リモート",
  ONSITE: "常駐",
  HYBRID: "ハイブリッド",
};

export const ADMIN_OPPORTUNITY_STATUS_TONE: Record<string, "positive" | "neutral" | "negative"> = {
  draft: "neutral",
  published: "positive",
  closed: "negative",
};

// ============================================================
// Summary cards
// ============================================================

export const ADMIN_OPPORTUNITY_SUMMARY_LABELS = {
  total: "全求人・案件",
  published: "公開中",
  draft: "下書き",
  closed: "終了",
} as const;

// ============================================================
// Search / filters
// ============================================================

export const ADMIN_OPPORTUNITY_SEARCH_LABELS = {
  label: "求人・案件を検索",
  placeholder: "タイトル・企業名・求人IDで検索",
} as const;

export const ADMIN_OPPORTUNITY_FILTER_LABELS = {
  title: "絞り込み条件",
  contractType: "サービス区分",
  status: "公開状態",
  reportState: "通報状況",
  postedWithin: "投稿日",
  resetLabel: "条件をリセット",
} as const;

export const ADMIN_OPPORTUNITY_REPORT_STATE_OPTIONS = [
  { value: "reported", label: "通報あり" },
  { value: "unreported", label: "通報なし" },
] as const;

export const ADMIN_OPPORTUNITY_DATE_RANGE_OPTIONS = [
  { label: "指定なし", days: null },
  { label: "7日以内", days: 7 },
  { label: "30日以内", days: 30 },
  { label: "90日以内", days: 90 },
] as const;

export interface AdminOpportunityFilterState {
  contractTypes: string[];
  statuses: string[];
  reportStates: string[];
  postedWithinDays: number | null;
}

export const DEFAULT_ADMIN_OPPORTUNITY_FILTER_STATE: AdminOpportunityFilterState = {
  contractTypes: [],
  statuses: [],
  reportStates: [],
  postedWithinDays: null,
};

// ============================================================
// Table / actions
// ============================================================

export const ADMIN_OPPORTUNITY_TABLE_COLUMNS = [
  "求人・案件",
  "企業",
  "区分・条件",
  "運用状況",
  "更新情報",
  "操作",
] as const;

export const ADMIN_OPPORTUNITY_ACTION_LABELS = {
  viewDetails: "詳細を見る",
  viewCompany: "企業確認",
  viewReports: "通報確認",
  takedown: "非公開にする",
  republish: "公開を再開する",
  close: "募集を終了する",
} as const;

export const ADMIN_OPPORTUNITY_RESULTS_META = {
  resultsSuffix: "件の求人・案件",
  visiblePrefix: "表示中",
  loadMore: "もっと見る",
} as const;

export const ADMIN_OPPORTUNITY_MODERATION_DIALOG_LABELS = {
  takedownTitle: "この求人・案件を非公開にしますか？",
  takedownDescription: "非公開にすると、検索結果や求人詳細ページに表示されなくなります。",
  takedownConfirmLabel: "非公開にする",
  republishTitle: "この求人・案件の公開を再開しますか？",
  republishDescription: "公開を再開すると、再び検索結果に表示されるようになります。",
  republishConfirmLabel: "公開を再開する",
  closeTitle: "この求人・案件の募集を終了しますか？",
  closeDescription: "終了すると、ステータスが「終了」になり、この操作は元に戻せません。",
  closeConfirmLabel: "募集を終了する",
} as const;

export const ADMIN_OPPORTUNITY_TAKEDOWN_REASON = {
  label: "非公開にする理由",
  placeholder: "非公開にする理由を入力してください（500文字以内）",
  helperText: "この理由は監査ログに記録されます。",
  requiredError: "非公開にする理由を入力してください。",
  tooLongError: "非公開にする理由は500文字以内で入力してください。",
  maxLength: 500,
} as const;

export const ADMIN_OPPORTUNITY_TOAST_MESSAGES = {
  takedown: "求人・案件を非公開にしました。",
  republish: "求人・案件の公開を再開しました。",
  close: "求人・案件の募集を終了しました。",
} as const;

export const ADMIN_OPPORTUNITY_MODERATION_ERROR_FALLBACK = "操作に失敗しました。もう一度お試しください。";

// ============================================================
// Detail page section labels
// ============================================================

export const ADMIN_OPPORTUNITY_DETAIL_SECTIONS = {
  basicInfo: "基本情報",
  recruitmentContent: "募集内容",
  contractConditions: "契約条件",
  requiredSkills: "必要スキル",
  applications: "応募状況",
  company: "掲載企業",
  publicationHistory: "公開操作履歴",
  reportHistory: "通報履歴",
} as const;

export const ADMIN_OPPORTUNITY_NOT_FOUND = {
  title: "求人・案件が見つかりませんでした。",
  description: "指定された求人・案件IDは存在しないか、削除された可能性があります。",
  ctaLabel: "求人・案件一覧に戻る",
  ctaHref: "/admin/opportunities",
} as const;
