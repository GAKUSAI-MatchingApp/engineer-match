/**
 * Company-side scout UI content (Japanese). Real Supabase-backed
 * (src/lib/company/scouts.ts, public.scouts per 082_scouts.sql). Review #24
 * 本対応 -- Scout-first flow: Company sends a scout to an Engineer who has
 * not applied to anything, and a direct chat only becomes possible once the
 * Engineer accepts (respond_to_scout RPC).
 */

export const ENGINEER_DETAIL_SCOUT_PANEL = {
  sendButtonLabel: "スカウトを送る",
  cancelLabel: "キャンセル",

  form: {
    title: "スカウトを送る",
    description: "メッセージを添えてスカウトを送信します。承諾されるとチャットが開始できます。",
    messageLabel: "メッセージ",
    messagePlaceholder: "自己紹介や興味を持った理由、想定しているポジションなどをご記入ください。",
    opportunityLabel: "関連する求人・案件（任意）",
    opportunityPlaceholder: "指定しない",
    submitLabel: "スカウトを送信",
    submittingLabel: "送信中…",
  },

  validation: {
    messageRequired: "メッセージを入力してください。",
    messageTooLong: "メッセージは2000文字以内で入力してください。",
  },

  sentMessage: "スカウトを送信しました。",

  status: {
    pendingLabel: "スカウト送信済み（返信待ち）",
    pendingDescription: "エンジニアの承諾/辞退をお待ちください。",
    acceptedLabel: "スカウトが承諾されました",
    acceptedDescription: "チャットで直接やり取りできます。",
    chatButtonLabel: "チャットを開く",
    declinedLabel: "スカウトが辞退されました",
    declinedDescription: "改めてスカウトを送信することもできます。",
    resendButtonLabel: "改めてスカウトを送る",
  },

  errorGeneric: "スカウトの送信に失敗しました。しばらくしてから再度お試しください。",
} as const;

export const COMPANY_SCOUT_CHAT_META = {
  backLabel: "エンジニア検索に戻る",
  backHref: "/company/engineers",
  notFoundTitle: "このチャットは見つかりませんでした。",
  notFoundDescription: "スカウトが辞退された、または存在しない可能性があります。",
} as const;
