/**
 * Engineer Job Search module content (Japanese).
 * Real Supabase-backed data (see src/lib/engineer/opportunities.ts) against
 * public.opportunities + opportunity_employment/project/hourly +
 * opportunity_required_skills + company_profiles. Option values below are
 * DB enum values and must match the CHECK constraints in
 * supabase/migrations/005-010 exactly.
 *
 * Fields with no DB backing in the original UI-only mock (location,
 * ITSS level, experience years, preferred skills, work-conditions table,
 * benefits, selection flow, employment condition disclosure) have been
 * dropped rather than fabricated.
 */

// ============================================================
// Shared vocabulary (DB enum values + display labels)
// ============================================================

export const CONTRACT_TYPE_OPTIONS = [
  { value: "employment", label: "就職" },
  { value: "project", label: "案件" },
  { value: "hourly", label: "時間清算" },
] as const;

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

export const WORK_STYLE_LABEL: Record<string, string> = {
  REMOTE: "フルリモート",
  ONSITE: "出社",
  HYBRID: "一部リモート",
};

/** opportunity_employment.work_style, per chk_opportunity_employment_work_style (006_opportunity_employment.sql). BR-39 search filter. */
export const WORK_STYLE_OPTIONS = [
  { value: "REMOTE", label: "フルリモート" },
  { value: "ONSITE", label: "出社" },
  { value: "HYBRID", label: "一部リモート" },
] as const;
export type WorkStyleFilterValue = (typeof WORK_STYLE_OPTIONS)[number]["value"] | "";

export const WORK_STYLE_BADGE_STYLES: Record<string, string> = {
  REMOTE: "bg-teal-50 text-teal-700",
  ONSITE: "bg-muted text-muted-foreground",
  HYBRID: "bg-cyan-50 text-cyan-700",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** Display-only label list (e.g. admin filter chips) — not a data-entity list. */
export const CONTRACT_TYPE_FILTER_OPTIONS = CONTRACT_TYPE_OPTIONS.map((option) => option.label);

// ============================================================
// Search header / filters
// ============================================================

export const SEARCH_HEADER = {
  title: "求人・案件検索",
  description: "あなたに合った求人・案件を検索できます。",
  searchPlaceholder: "求人タイトルで検索",
  searchButtonLabel: "検索",
  searchLabel: "求人・案件を検索",
} as const;

export const FILTER_LABELS = {
  title: "絞り込み条件",
  searchLabel: "求人を検索",
  searchPlaceholder: "求人タイトル・仕事内容で検索",
  contractTypeLabel: "契約形態",
  contractTypeAllLabel: "すべての契約形態",
  sortLabel: "並び替え",
  resetLabel: "条件をリセット",
  skillLabel: "必須スキル",
  skillPlaceholder: "スキル名で検索",
  skillSelectedCountSuffix: "件選択中",
  skillEmptyMessage: "登録されているスキルがありません。",
  workStyleLabel: "勤務形態",
  workStyleAllLabel: "すべての勤務形態",
  workStyleUnavailableNote:
    "契約形態が「就職」「時間単価」または「すべて」の場合に選択できます。",
} as const;

// ============================================================
// Job list / job card
// ============================================================

export const JOB_LIST_META = {
  resultsSuffix: "件の求人・案件が見つかりました",
  bookmarkLabel: "お気に入りに追加",
  bookmarkedLabel: "お気に入り済み",
  detailButtonLabel: "詳細を見る",
  updatedPrefix: "更新：",
} as const;

export const LOADING_STATE_LABELS = {
  message: "求人・案件を読み込んでいます…",
} as const;

export const ERROR_STATE_LABELS = {
  title: "求人・案件の読み込みに失敗しました。",
  description: "しばらくしてから再度お試しください。",
  retryLabel: "再読み込み",
} as const;

export const EMPTY_STATE_LABELS = {
  title: "条件に一致する求人・案件が見つかりませんでした。",
  description: "検索キーワードや絞り込み条件を変更してお試しください。",
  resetLabel: "条件をリセット",
} as const;

export const NO_JOBS_STATE_LABELS = {
  title: "現在公開されている求人・案件はありません。",
  description: "しばらくしてから再度ご確認ください。",
} as const;

export const SIGN_IN_REQUIRED_LABELS = {
  title: "ログインが必要です。",
  description: "求人・案件の閲覧にはログインが必要です。",
  ctaLabel: "ログイン",
  ctaHref: "/login",
} as const;

// ============================================================
// Job detail
// ============================================================

export const JOB_DETAIL_META = {
  backLabel: "求人一覧に戻る",
  backHref: "/engineer/jobs",
} as const;

export const JOB_DETAIL_SECTION_LABELS = {
  descriptionTitle: "仕事内容",
  requiredSkillsTitle: "必須スキル",
  companyInfoTitle: "企業情報",
} as const;

export const COMPANY_INFO_LABELS = {
  businessLabel: "事業内容",
  industryLabel: "業種",
  employeesLabel: "従業員数",
  prefectureLabel: "所在地",
  establishedYearLabel: "設立年",
  websiteLabel: "コーポレートサイト",
} as const;

export const JOB_NOT_FOUND_LABELS = {
  title: "求人・案件が見つかりませんでした。",
  description: "掲載が終了しているか、URLが正しくない可能性があります。",
  ctaLabel: "求人一覧に戻る",
} as const;

// ============================================================
// Apply sidebar
// ============================================================

export const APPLY_SIDEBAR_LABELS = {
  applyLabel: "応募する",
  applying: "応募処理中…",
  alreadyAppliedLabel: "応募済み",
  favoriteLabel: "お気に入り",
  favoritedLabel: "お気に入り済み",
  updatedLabel: "更新日",
  appliedMessage: "応募を受け付けました。",
  duplicateApplicationMessage: "この求人・案件にはすでに応募済みです。",
  applyErrorMessage: "応募処理に失敗しました。しばらくしてから再度お試しください。",
  favoriteErrorMessage: "お気に入り処理に失敗しました。しばらくしてから再度お試しください。",
  signInRequiredMessage: "応募にはログインが必要です。",
} as const;
