/**
 * Engineer Settings content (Japanese). Three sections have a real
 * Supabase/Auth-backed action today: public-profile visibility
 * (engineer_profiles.is_public, src/lib/engineer/profile.ts), password
 * change (supabase.auth.updateUser), and account withdrawal
 * (public.withdraw_own_account RPC, Phase 3). Account text-field editing,
 * per-category notification toggles, career/preference/last-login/scout/
 * search-listing privacy toggles, 2FA, login history, and session
 * management still have no real backing (no preference-storage schema) --
 * removed rather than left as fake UI, per this phase's rule against
 * preserving mock behavior just because a screen already existed.
 */

export const ENGINEER_SETTINGS_PAGE = {
  title: "設定",
  description: "公開範囲とパスワードを管理できます。",
} as const;

// ============================================================
// 公開・プライバシー設定 -- engineer_profiles.is_public
// ============================================================

export const ENGINEER_PRIVACY_SETTINGS = {
  title: "公開・プライバシー設定",
  description: "プロフィールの公開範囲を設定できます。",
  toggle: {
    id: "profilePublic",
    label: "プロフィールを企業に公開",
    description: "オンにすると、企業があなたのプロフィールを閲覧できるようになります。",
  },
  savedMessage: "公開設定を保存しました。",
  errorMessage: "公開設定の保存に失敗しました。しばらくしてから再度お試しください。",
} as const;

// ============================================================
// LINE通知連携 -- public.line_notification_links (077_line_notification_links.sql).
// Notification-linking only -- LINE is never a Supabase Auth sign-in method
// here (see src/app/auth/line/callback/route.ts's header comment).
// ============================================================

export const ENGINEER_LINE_SETTINGS = {
  title: "LINE通知連携",
  description:
    "LINEアカウントと連携すると、新着メッセージや選考ステータスの更新などの通知をLINEでも受け取れます。",
  unlinked: {
    connectButtonLabel: "LINEと連携する",
    note: "連携時に、LINEの氏名・プロフィール画像の取得と、通知メッセージ送信のための連携を行います。",
  },
  needsFriend: {
    badgeLabel: "友だち追加が必要です",
    message: "通知を受け取るには、LINE公式アカウントを友だち追加してください。",
    addFriendButtonLabel: "公式アカウントを追加する",
  },
  active: {
    badgeLabel: "連携済み",
    connectedAsLabel: (name: string) => `${name}さんと連携中`,
    toggleLabel: "LINE通知",
    toggleDescription: "オンにすると、アプリ内通知をLINEでも受け取れます。",
  },
  unlinkButtonLabel: "連携を解除",
  unlinkDialog: {
    title: "LINE連携を解除しますか？",
    description: "解除後はLINEで通知を受け取れなくなります。いつでも再連携できます。",
    cancelLabel: "キャンセル",
    confirmLabel: "解除する",
    submittingLabel: "処理中…",
    errorGeneric: "LINE連携の解除に失敗しました。しばらくしてから再度お試しください。",
  },
  toast: {
    linkedActive: "LINE連携が完了しました。通知が届きます。",
    linkedNeedsFriend: "LINE連携が完了しました。通知を受け取るには友だち追加してください。",
    errorAlreadyLinked: "このLINEアカウントは既に別のアカウントで使用されています。",
    errorStateMismatch: "連携処理を確認できませんでした。もう一度お試しください。",
    errorDenied: "LINE連携がキャンセルされました。",
    errorIneligible: "現在のアカウントではLINE連携を利用できません。",
    errorGeneric: "LINE連携に失敗しました。しばらくしてから再度お試しください。",
  },
  errorToggleGeneric: "LINE通知設定の変更に失敗しました。しばらくしてから再度お試しください。",
} as const;

// ============================================================
// セキュリティ設定 -- supabase.auth.updateUser({ password })
// ============================================================

export const ENGINEER_SECURITY_SETTINGS = {
  title: "セキュリティ設定",
  description: "ログインパスワードを変更できます。",
  currentPasswordLabel: "現在のパスワード",
  newPasswordLabel: "新しいパスワード",
  confirmPasswordLabel: "新しいパスワード（確認）",
  submitLabel: "パスワードを変更",
  submittingLabel: "変更中…",
  successMessage: "パスワードを変更しました。",
  errorMismatch: "パスワードが一致しません。",
  errorTooShort: "パスワードは8文字以上で入力してください。",
  errorCurrentPasswordInvalid: "現在のパスワードが正しくありません。",
  errorGeneric: "パスワードの変更に失敗しました。しばらくしてから再度お試しください。",
} as const;

// ============================================================
// Danger Zone -- 退会 (withdraw_own_account RPC,
// 062_self_service_account_withdrawal.sql draft, RD-2026-001 BR-115~118)
// ============================================================

export const ENGINEER_DANGER_ZONE = {
  title: "Danger Zone",
  description: "この操作は取り消せません。慎重に行ってください。",
  withdraw: {
    label: "退会",
    description: "アカウントを退会します。退会後はログインできなくなります。",
    buttonLabel: "退会する",
  },
  dialog: {
    title: "アカウントを退会しますか？",
    ongoingApplicationsWarning: (count: number) =>
      `現在、進行中の応募が${count}件あります。退会すると選考中の企業に影響する可能性があります。`,
    dataRetentionNote:
      "退会後も、応募・メッセージ・レビューなどの履歴データは削除されません。",
    reasonLabel: "退会理由（任意）",
    reasonPlaceholder: "理由をお聞かせください（任意）",
    reasonMaxLength: 500,
    reasonNote: "※ 退会理由の保存には現在対応していません（今後のアップデートで対応予定です）。",
    passwordLabel: "現在のパスワード",
    passwordPlaceholder: "確認のため現在のパスワードを入力してください",
    cancelLabel: "キャンセル",
    confirmLabel: "退会する",
    submittingLabel: "処理中…",
    errorPasswordInvalid: "現在のパスワードが正しくありません。",
    errorGeneric: "退会処理に失敗しました。しばらくしてから再度お試しください。",
  },
} as const;
