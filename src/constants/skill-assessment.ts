/**
 * Human Skill self-assessment flow content (Japanese).
 * Real Supabase-backed (see src/lib/engineer/skill-assessments.ts) against
 * public.skill_assessments / skill_assessment_questions /
 * skill_assessment_attempts / skill_assessment_answers
 * (030_skill_assessments.sql).
 */

export const ASSESSMENT_PAGE_META = {
  backLabel: "プロフィールに戻る",
  backHref: "/engineer/profile",
} as const;

export const ASSESSMENT_PROGRESS_LABELS = {
  suffix: "問回答済み",
} as const;

export const ASSESSMENT_ANSWER_LABELS = {
  yes: "はい",
  no: "いいえ",
} as const;

export const ASSESSMENT_ACTION_LABELS = {
  submit: "診断結果を見る",
  submitting: "送信中…",
  incompleteNote: "すべての設問に回答すると送信できます。",
  retryLabel: "もう一度試す",
  backToProfile: "プロフィールに戻る",
} as const;

export const ASSESSMENT_LOADING_LABELS = {
  message: "診断を読み込んでいます…",
} as const;

export const ASSESSMENT_ERROR_LABELS = {
  loadFailedTitle: "診断の読み込みに失敗しました。",
  loadFailedDescription: "しばらくしてから再度お試しください。",
  submitFailedMessage: "診断結果の保存に失敗しました。しばらくしてから再度お試しください。",
  notFoundTitle: "この診断は見つかりませんでした。",
  notFoundDescription: "指定された診断は存在しないか、削除された可能性があります。",
  signInRequiredTitle: "ログインが必要です。",
  signInRequiredDescription: "診断の実施にはログインが必要です。",
  signInCtaLabel: "ログイン",
  signInCtaHref: "/login",
} as const;

export const ASSESSMENT_RESULT_LABELS = {
  title: "最終スコア",
  yesCountPrefix: "Yes",
  yesCountSuffix: "/ 10",
} as const;

export const HUMAN_SKILL_CARD_LABELS = {
  notAssessed: "未診断",
  startLabel: "診断する",
  retakeLabel: "再診断する",
} as const;
