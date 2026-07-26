/**
 * Admin Messages monitoring module labels (Japanese). Real conversation data
 * comes from src/lib/admin/messages.ts (chat_rooms + messages). No
 * moderation metadata exists in the schema (no report count, handling
 * status, or restriction flag) -- there is no admin UPDATE policy on
 * messages by design, so this is read-only monitoring, not moderation.
 */

export const ADMIN_MESSAGES_PAGE = {
  title: "メッセージ管理",
  description: "プラットフォーム全体の会話を確認できます（閲覧のみ）。",
} as const;

// ============================================================
// Summary cards
// ============================================================

export const ADMIN_MESSAGE_SUMMARY_LABELS = {
  total: "全会話",
  updatedToday: "本日更新",
} as const;

// ============================================================
// Search / filters
// ============================================================

export const ADMIN_MESSAGE_SEARCH_LABELS = {
  label: "会話を検索",
  placeholder: "参加者名・企業名・求人名で検索",
} as const;

export const ADMIN_MESSAGE_FILTER_LABELS = {
  title: "絞り込み条件",
  updatedWithin: "更新日",
  resetLabel: "条件をリセット",
} as const;

export const ADMIN_MESSAGE_DATE_RANGE_OPTIONS = [
  { label: "指定なし", days: null },
  { label: "7日以内", days: 7 },
  { label: "30日以内", days: 30 },
  { label: "90日以内", days: 90 },
] as const;

export interface AdminMessageFilterState {
  updatedWithinDays: number | null;
}

export const DEFAULT_ADMIN_MESSAGE_FILTER_STATE: AdminMessageFilterState = {
  updatedWithinDays: null,
};

// ============================================================
// Table
// ============================================================

export const ADMIN_MESSAGE_TABLE_COLUMNS = [
  "参加者",
  "関連求人・案件",
  "最新メッセージ",
  "最終更新",
  "メッセージ数",
] as const;

export const ADMIN_MESSAGE_ACTION_LABELS = {
  viewDetails: "詳細を見る",
} as const;

export const ADMIN_MESSAGE_RESULTS_META = {
  resultsSuffix: "件の会話",
} as const;

// ============================================================
// Detail page section labels
// ============================================================

export const ADMIN_MESSAGE_DETAIL_SECTIONS = {
  participants: "参加者",
  relatedOpportunity: "関連求人・案件",
  transcript: "会話履歴",
} as const;

export const ADMIN_MESSAGE_NOT_FOUND = {
  title: "会話が見つかりませんでした。",
  description: "指定された会話IDは存在しないか、削除された可能性があります。",
  ctaLabel: "メッセージ管理に戻る",
  ctaHref: "/admin/messages",
} as const;
