/**
 * Engineer Settings content (Japanese). Only two sections have a real
 * Supabase/Auth-backed action today: public-profile visibility
 * (engineer_profiles.is_public, src/lib/engineer/profile.ts) and password
 * change (supabase.auth.updateUser). Account text-field editing, per-category
 * notification toggles, career/preference/last-login/scout/search-listing
 * privacy toggles, 2FA, login history, session management, and account
 * suspend/delete all had no real backing (no preference-storage schema, and
 * users.role/status/deleted_at are RLS-protected from self-service changes)
 * -- removed rather than left as fake UI, per this phase's rule against
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
