/**
 * Company Settings module content (Japanese). Password change and account
 * info are real (Supabase Auth / public.company_profiles). The remaining
 * controls (notification preferences, 2FA, login history, session
 * management, account deactivation/deletion) have no backing table or
 * infrastructure in this schema yet -- kept visible per client instruction
 * (do not remove existing UI), but honestly marked as not yet available
 * rather than faking a save. Company profile visibility is not a toggle:
 * public.company_profiles is always public by design (business rule BR-18,
 * see company_profiles_select_all in 023_profile_policies.sql) -- there is
 * no is_public column, intentionally.
 */

export const COMPANY_SETTINGS_PAGE = {
  title: "設定",
  description: "アカウント・通知・セキュリティなどの設定を管理できます。",
} as const;

export const COMPANY_SETTINGS_UNAVAILABLE_NOTE =
  "※ この設定は準備中のため、変更は保存されません。";

// ============================================================
// 1. アカウント設定
// ============================================================

export const COMPANY_ACCOUNT_SETTINGS = {
  title: "アカウント設定",
  description: "企業情報とアカウントの基本設定です。",
  companyNameLabel: "企業名",
  contactPersonLabel: "担当者名",
  emailLabel: "メールアドレス",
  unset: "未設定",
  editHint: "企業名・担当者名は企業プロフィールで編集できます。",
  editLinkLabel: "企業プロフィールを編集",
  editLinkHref: "/company/profile",
} as const;

// ============================================================
// 2. 通知設定 / 4. 公開設定（共通トグル型）
// ============================================================

export interface CompanyToggleItem {
  id: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

export const COMPANY_NOTIFICATION_SETTINGS = {
  title: "通知設定",
  description: "受け取る通知の種類を選択できます。",
  savedMessage: "通知設定を保存しました。",
} as const;

export const COMPANY_NOTIFICATION_TOGGLES: CompanyToggleItem[] = [
  {
    id: "applications",
    label: "応募通知",
    description: "新しい応募があった際に通知します。",
    defaultChecked: true,
  },
  {
    id: "messages",
    label: "メッセージ通知",
    description: "新しいメッセージを受信した際に通知します。",
    defaultChecked: true,
  },
  {
    id: "scoutReplies",
    label: "スカウト返信通知",
    description: "送信したスカウトへの返信があった際に通知します。",
    defaultChecked: true,
  },
  {
    id: "interviews",
    label: "面接予定通知",
    description: "面接の予定が確定・変更された際に通知します。",
    defaultChecked: true,
  },
  {
    id: "system",
    label: "システム通知",
    description: "メンテナンスや重要なお知らせを通知します。",
    defaultChecked: true,
  },
  {
    id: "email",
    label: "メール通知",
    description: "上記の通知をメールでも受け取ります。",
    defaultChecked: false,
  },
];

// ============================================================
// 3. セキュリティ設定
// ============================================================

export const COMPANY_SECURITY_SETTINGS = {
  title: "セキュリティ設定",
  description: "アカウントのセキュリティに関する設定です。",
  currentPasswordLabel: "現在のパスワード",
  newPasswordLabel: "新しいパスワード",
  confirmPasswordLabel: "新しいパスワード（確認）",
  submitLabel: "パスワードを変更",
  submittingLabel: "変更中…",
  successMessage: "パスワードを変更しました。",
  errorTooShort: "パスワードは8文字以上で入力してください。",
  errorMismatch: "パスワードが一致しません。",
  errorCurrentPasswordInvalid: "現在のパスワードが正しくありません。",
  errorGeneric: "パスワードの変更に失敗しました。しばらくしてから再度お試しください。",
  twoFactor: {
    label: "2段階認証",
    description: "ログイン時に確認コードを要求し、セキュリティを強化します。",
    defaultChecked: false,
  },
  loginHistory: {
    label: "ログイン履歴",
    description: "直近のログイン状況を確認できます。",
    unavailableMessage: "ログイン履歴機能は現在準備中です。",
  },
  sessionManagement: {
    label: "セッション管理",
    description: "現在ログイン中の他のセッションを管理できます。",
    revokeAllLabel: "他のセッションをすべてログアウト",
  },
} as const;

// ============================================================
// 4. 公開設定
// ============================================================

export const COMPANY_VISIBILITY_SETTINGS = {
  title: "公開設定",
  description: "企業情報の公開範囲を確認できます。",
  profilePublicLabel: "企業プロフィール公開",
  profilePublicNote: "企業プロフィールは常に公開されます。（非公開設定はご利用いただけません）",
  jobsPublicLabel: "求人・案件の公開",
  jobsPublicNote: "各求人・案件の公開・非公開は「求人・案件管理」から設定できます。",
  jobsPublicHref: "/company/jobs",
} as const;

export const COMPANY_VISIBILITY_TOGGLES: CompanyToggleItem[] = [
  {
    id: "contactVisible",
    label: "連絡先表示",
    description: "応募者に対して担当者の連絡先を表示します。",
    defaultChecked: false,
  },
  {
    id: "searchListed",
    label: "検索結果への表示",
    description: "エンジニア検索の結果に企業名を表示します。",
    defaultChecked: true,
  },
];

// ============================================================
// 5. Danger Zone
// ============================================================

export const COMPANY_DANGER_ZONE = {
  title: "Danger Zone",
  description: "これらの操作は取り消せません。慎重に行ってください。",
  cancelLabel: "キャンセル",
  deactivate: {
    label: "アカウントを無効化",
    description: "アカウントを一時的に無効化します。求人・案件は非公開になります。",
    buttonLabel: "無効化する",
    dialogTitle: "本当にアカウントを無効化しますか？",
    dialogDescription:
      "無効化すると、求人・案件が非公開になり、ログインできなくなります。",
    confirmLabel: "無効化する",
  },
  delete: {
    label: "アカウント削除",
    description: "アカウントとすべてのデータを完全に削除します。",
    buttonLabel: "削除する",
    dialogTitle: "本当にアカウントを削除しますか？",
    dialogDescription: "この操作は取り消せません。すべてのデータが完全に削除されます。",
    confirmLabel: "完全に削除する",
  },
} as const;
