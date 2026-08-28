import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Confirms an in-progress email change. `EngineerEmailSettings` calls
 * `supabase.auth.updateUser({ email }, { emailRedirectTo: '<origin>/auth/email-change/callback' })`,
 * which sends a confirmation link to the new address (and, if Secure Email
 * Change is enabled in the Supabase dashboard, a second one to the current
 * address too -- both point back here). GoTrue only writes the confirmed
 * value into auth.users.email once every required link has been used, which
 * is what the on_auth_user_email_updated trigger
 * (081_public_users_email_sync_and_protection.sql) mirrors into
 * public.users.email -- nothing in this route touches either column
 * directly.
 *
 * A separate route from /auth/callback (password recovery) and
 * /auth/oauth/callback (OAuth sign-in), matching their existing pattern of
 * one dedicated, fixed-destination route per flow rather than branching on a
 * `next`/`redirectTo` query param (see /auth/callback's header comment for
 * why that doesn't reliably survive Supabase's redirect_to allow-list).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/engineer/settings?emailChanged=1#email`);
    }
  }

  // No code, or the exchange failed (expired/already-used/tampered link):
  // land back on the settings email section with an error flag rather than a
  // bare redirect to /login, so EngineerEmailSettings can render its own
  // "confirmation link is invalid or expired" message via mapEmailChangeError.
  return NextResponse.redirect(`${origin}/engineer/settings?emailChangeError=1#email`);
}
