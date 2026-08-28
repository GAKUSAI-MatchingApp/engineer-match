/**
 * Engineer-side scout UI content (Japanese). Real Supabase-backed
 * (src/lib/engineer/scouts.ts, public.scouts per 082_scouts.sql).
 */

export const ENGINEER_SCOUTS_PAGE = {
  title: "スカウト",
  description: "企業から届いたスカウトを確認し、承諾または辞退できます。",
} as const;

export const ENGINEER_SCOUT_STATUS_LABELS: Record<"pending" | "accepted" | "declined", string> = {
  pending: "返信待ち",
  accepted: "承諾済み",
  declined: "辞退済み",
};

export const ENGINEER_SCOUT_STATUS_STYLES: Record<"pending" | "accepted" | "declined", string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  declined: "bg-gray-100 text-gray-600",
};

export const ENGINEER_SCOUT_CARD_LABELS = {
  fromLabel: "スカウト元",
  opportunityLabel: "関連する求人・案件",
  receivedAtPrefix: "受信日：",
  acceptLabel: "承諾する",
  declineLabel: "辞退する",
  respondingLabel: "処理中…",
  chatButtonLabel: "チャットを開く",
  errorGeneric: "処理に失敗しました。しばらくしてから再度お試しください。",
} as const;

export const ENGINEER_SCOUT_EMPTY_STATE_LABELS = {
  title: "スカウトはまだありません。",
  description: "企業からスカウトが届くと、ここに表示されます。",
} as const;

export const ENGINEER_SCOUTS_SIGN_IN_REQUIRED_LABELS = {
  title: "ログインが必要です。",
  description: "スカウトの確認にはログインが必要です。",
  ctaLabel: "ログイン",
  ctaHref: "/login",
} as const;

export const ENGINEER_SCOUT_CHAT_META = {
  backLabel: "スカウト一覧に戻る",
  backHref: "/engineer/scouts",
  notFoundTitle: "このチャットは見つかりませんでした。",
  notFoundDescription: "スカウトを承諾するとチャットが開始できます。",
} as const;
