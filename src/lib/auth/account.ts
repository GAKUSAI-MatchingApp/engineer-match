import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * public.users.role / .status shape, per 002_users.sql. Not generated from a
 * Database type (no Supabase codegen has been run for this project), so this
 * is a minimal hand-written shape for the two columns actually queried here.
 */
export interface UserAccount {
  role: string;
  status: string;
}

/** The only status value that may continue past login (chk_users_status in 002_users.sql: ACTIVE / SUSPENDED / WITHDRAWN). */
export const ACTIVE_STATUS = "ACTIVE";

export async function getUserAccount(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserAccount | null> {
  const { data, error } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[auth] failed to load public.users row:", error);
    return null;
  }

  return data as UserAccount | null;
}

/**
 * Maps a public.users.role value to its dashboard route. Only ENGINEER,
 * COMPANY, and ADMIN have a route today — confirmed by inspecting
 * src/app/{engineer,company,admin}; there is no instructor route yet even
 * though INSTRUCTOR is a valid role. Returns null when there's nowhere to
 * send the user (INSTRUCTOR, or any unrecognized role).
 */
export function getDashboardPathForRole(role: string): string | null {
  switch (role) {
    case "ENGINEER":
      return "/engineer/dashboard";
    case "COMPANY":
      return "/company/dashboard";
    case "ADMIN":
      return "/admin";
    default:
      return null;
  }
}

/**
 * Calls the withdraw_own_account() SECURITY DEFINER RPC (see
 * 062_self_service_account_withdrawal.sql draft). Performs the caller's own
 * ACTIVE -> WITHDRAWN transition server-side -- there is no id/status/
 * deleted_at parameter, since the function only ever acts on auth.uid().
 * Every eligibility rule (role, current status, COMPANY published-
 * opportunity guard) is re-validated inside the function; this is just the
 * thin client-side call, not a place to duplicate that logic.
 */
export async function withdrawOwnAccount(
  supabase: SupabaseClient,
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.rpc("withdraw_own_account");
  return { error };
}

/** Roles a brand-new OAuth user may self-assign via finalizeOAuthRole(). Never ADMIN/INSTRUCTOR. */
export type OAuthOnboardingRole = "ENGINEER" | "COMPANY";

/**
 * Calls the finalize_oauth_role(p_role) SECURITY DEFINER RPC (migration 071,
 * draft — not yet applied). Creates the caller's own public.users row —
 * scoped to auth.uid() server-side, never a client-supplied id — exactly
 * once, as ENGINEER or COMPANY only. Refuses (no update, no second row) if a
 * public.users row already exists for this id, so this can never change an
 * existing role or be replayed.
 */
export async function finalizeOAuthRole(
  supabase: SupabaseClient,
  role: OAuthOnboardingRole,
): Promise<{ data: UserAccount | null; error: { code?: string; message: string } | null }> {
  const { data, error } = await supabase.rpc("finalize_oauth_role", { p_role: role });

  if (error) {
    return {
      data: null,
      error: { code: (error as { code?: string }).code, message: error.message },
    };
  }

  return { data: data as UserAccount, error: null };
}
