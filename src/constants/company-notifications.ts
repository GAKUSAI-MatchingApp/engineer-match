/**
 * Real Supabase-backed Company notification content (Japanese). See
 * src/lib/engineer/notifications.ts (public.notifications, 013_notifications.sql)
 * -- the read/mark-read functions there are fully generic (keyed by the
 * caller's own user_id, no role assumption), so they are reused directly
 * rather than duplicated for Company.
 *
 * Mirrors src/constants/engineer-notifications.ts. type is the real 4-value
 * enum (chk_notifications_type); there is no separate mock category set here.
 * The table has exactly one real producer today
 * (private.notify_new_message(), a trigger fired on new chat messages) --
 * application_received / application_status_changed / opportunity_closed
 * have no producer yet, so this page will honestly show no notifications of
 * those types until one exists.
 */

import type { NotificationType } from "@/lib/engineer/notifications";

export const COMPANY_NOTIFICATIONS_PAGE = {
  title: "通知",
  description: "応募・メッセージなどの通知を確認できます。",
} as const;

export const COMPANY_NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  application_received: "応募受付",
  application_status_changed: "選考ステータス変更",
  new_message: "新着メッセージ",
  opportunity_closed: "求人・案件終了",
  review_received: "新着評価",
  review_reply_received: "評価への返信",
  // scout_received is only ever inserted for engineer_id (private.notify_scout_received(),
  // 082_scouts.sql) -- a Company account can never actually receive one, but
  // NotificationType is a single shared union, so this entry exists for
  // exhaustive Record<> type-completeness only.
  scout_received: "スカウト受信",
};

export const COMPANY_NOTIFICATION_TYPE_STYLES: Record<NotificationType, string> = {
  application_received: "bg-blue-50 text-blue-700",
  application_status_changed: "bg-amber-50 text-amber-700",
  new_message: "bg-emerald-50 text-emerald-700",
  opportunity_closed: "bg-gray-100 text-gray-600",
  review_received: "bg-yellow-50 text-yellow-700",
  review_reply_received: "bg-yellow-50 text-yellow-700",
  scout_received: "bg-purple-50 text-purple-700",
};

export const COMPANY_NOTIFICATION_FILTER_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "unread", label: "未読のみ" },
  { value: "application_received", label: "応募受付" },
  { value: "application_status_changed", label: "選考ステータス変更" },
  { value: "new_message", label: "新着メッセージ" },
  { value: "opportunity_closed", label: "求人・案件終了" },
  { value: "review_received", label: "新着評価" },
  { value: "review_reply_received", label: "評価への返信" },
] as const;
export type CompanyNotificationFilter = (typeof COMPANY_NOTIFICATION_FILTER_OPTIONS)[number]["value"];

export const COMPANY_NOTIFICATION_ACTIONS_LABELS = {
  markReadLabel: "既読にする",
  markAllReadLabel: "すべて既読にする",
  unreadLabel: "未読",
} as const;

export const COMPANY_NOTIFICATION_EMPTY_STATE_LABELS = {
  title: "通知はありません。",
  description: "条件に一致する通知が見つかりませんでした。",
} as const;

export const COMPANY_NOTIFICATION_SUMMARY_LABELS = {
  unread: "未読",
  all: "すべて",
} as const;

export const COMPANY_NOTIFICATIONS_SIGN_IN_REQUIRED_LABELS = {
  title: "ログインが必要です。",
  description: "通知の確認にはログインが必要です。",
  ctaLabel: "ログイン",
  ctaHref: "/login",
} as const;
