import type { AuthError, User } from "@supabase/supabase-js";

/**
 * True when this account can sign in with a password (has an "email"
 * identity/provider) -- as opposed to an OAuth-only account (Google/GitHub)
 * that has never set one. `app_metadata.providers` lists every linked
 * provider (auth-js `UserAppMetadata`), populated by GoTrue itself, not
 * app code.
 */
export function isPasswordAuthUser(user: Pick<User, "app_metadata"> | null): boolean {
  return Boolean(user?.app_metadata?.providers?.includes("email"));
}

/**
 * Maps a Supabase Auth error (email-change request, reauth, or the
 * confirmation-link callback) to a Japanese message safe to show a user.
 * Never surfaces error.message directly (RD security review: no raw
 * Supabase/Postgres error text in the UI). Falls back to a generic message
 * for any code not explicitly handled here -- including error codes newer
 * than this SDK version knows about.
 */
export function mapEmailChangeError(error: Pick<AuthError, "code" | "status"> | null): string {
  switch (error?.code) {
    case "email_exists":
    case "user_already_exists":
    case "identity_already_exists":
    case "email_conflict_identity_not_deletable":
      return "このメールアドレスは既に別のアカウントで使用されています。";
    case "email_address_invalid":
    case "validation_failed":
      return "メールアドレスの形式が正しくありません。";
    case "invalid_credentials":
      return "現在のパスワードが正しくありません。";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "リクエストが多すぎます。しばらくしてから再度お試しください。";
    case "session_expired":
    case "session_not_found":
    case "bad_jwt":
      return "ログイン状態を確認できませんでした。再度ログインしてからお試しください。";
    case "flow_state_expired":
    case "flow_state_not_found":
    case "otp_expired":
    case "bad_code_verifier":
      return "確認リンクの有効期限が切れているか、無効です。もう一度メールアドレスの変更手続きをやり直してください。";
    case "email_provider_disabled":
    case "signup_disabled":
      return "現在この操作を利用できません。しばらくしてから再度お試しください。";
    default:
      return "メールアドレスの変更に失敗しました。しばらくしてから再度お試しください。";
  }
}
