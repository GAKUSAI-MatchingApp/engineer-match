/**
 * Company Engineer Search module content (Japanese).
 * Real Supabase-backed data (see src/lib/company/engineers.ts) against
 * public.users + engineer_profiles + user_skills/skills +
 * user_qualifications/qualifications + skill_assessments (Human/Business
 * final levels only -- src/lib/engineer/skill-assessments.ts, unmodified).
 *
 * Fields with no DB backing in the original UI-only mock (job title,
 * category, availability status, expected compensation beyond
 * desired_rate_min/max, work history, education, portfolio projects,
 * languages, last-active/registered dates, profile completion, favorite/
 * scout state) have been dropped rather than fabricated. Company->engineer
 * favorites and scouting have no supporting schema (public.favorites is
 * opportunity-only, ENGINEER-scoped by RLS) and are deferred, not faked.
 */

export const ENGINEERS_PAGE = {
  title: "エンジニア検索",
  description: "スキル・経験・希望条件から、\n自社に合うエンジニアを検索できます。",
} as const;

// ============================================================
// Filter vocabulary
// ============================================================

/** engineer_profiles.work_style, per chk_engineer_profiles_work_style (004_profile_tables.sql). */
export const WORK_STYLE_FILTER_OPTIONS = [
  { value: "REMOTE", label: "フルリモート" },
  { value: "ONSITE", label: "出社" },
  { value: "HYBRID", label: "一部リモート" },
] as const;

export const ITSS_LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

export const EXPERIENCE_BUCKET_OPTIONS = [
  { label: "指定なし", value: null },
  { label: "1年以上", value: 1 },
  { label: "3年以上", value: 3 },
  { label: "5年以上", value: 5 },
  { label: "10年以上", value: 10 },
] as const;
export type ExperienceBucket = (typeof EXPERIENCE_BUCKET_OPTIONS)[number]["value"];

// ============================================================
// Sort
// ============================================================

export const SORT_OPTIONS = [
  { value: "experience", label: "経験年数が多い順" },
  { value: "itss", label: "ITSSレベルが高い順" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

// ============================================================
// Search / filter labels
// ============================================================

export const SEARCH_LABELS = {
  label: "エンジニアを検索",
  placeholder: "氏名・スキルで検索",
} as const;

export const FILTER_LABELS = {
  title: "絞り込み条件",
  prefectures: "居住地",
  workStyles: "希望の働き方",
  skills: "テクニカルスキル",
  itssLevels: "ITSSレベル",
  experience: "経験年数",
  jobCategories: "職種カテゴリ",
  availabilityStatuses: "稼働状況",
  resetLabel: "条件をリセット",
  openLabel: "絞り込み",
  closeLabel: "閉じる",
  applyLabel: "この条件で絞り込む",
} as const;

export const ACTIVE_FILTERS_LABELS = {
  clearAllLabel: "すべてクリア",
  removeLabelPrefix: "フィルターを削除：",
  itssPrefix: "ITSS",
} as const;

export const RESULTS_META = {
  resultsSuffix: "名のエンジニアが見つかりました",
} as const;

export const EMPTY_STATE_LABELS = {
  title: "条件に一致するエンジニアが見つかりませんでした。",
  description: "検索キーワードや絞り込み条件を変更してお試しください。",
  resetLabel: "条件をリセット",
} as const;

export const NO_ENGINEERS_LABELS = {
  title: "検索可能なエンジニアがまだいません。",
  description: "プロフィールを公開しているエンジニアが登録され次第、ここに表示されます。",
} as const;

// ============================================================
// Engineer card
// ============================================================

export const ENGINEER_CARD_LABELS = {
  detailLabel: "詳細を見る",
  experienceSuffix: "年",
  itssLabel: "ITSS",
  qualificationsLabel: "資格",
  humanSkillLabel: "ヒューマンスキル診断済み",
  businessSkillLabel: "ビジネススキル診断済み",
  noSkillsMessage: "テクニカルスキル未登録",
} as const;

// ============================================================
// Engineer detail — section labels
// ============================================================

export const ENGINEER_DETAIL_META = {
  backLabel: "エンジニア検索に戻る",
  backHref: "/company/engineers",
  overviewTitle: "プロフィール概要",
  humanSkillTitle: "ヒューマンスキル",
  businessSkillTitle: "ビジネススキル",
  notFoundTitle: "このエンジニアのプロフィールは見つかりませんでした。",
  notFoundDescription: "存在しないか、非公開に設定されている可能性があります。",
  contactNote: "※ メッセージ・スカウト機能は準備中です。",
} as const;
