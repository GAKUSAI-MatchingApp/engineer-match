import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUS, getUserAccount } from "@/lib/auth/account";
import { buildLineAuthorizeUrl, generateLineOAuthState, LINE_OAUTH_STATE_COOKIE } from "@/lib/line/client";

/**
 * Entry point for the Engineer Settings "LINEと連携する" button. Not itself a
 * login/session flow -- the caller must already be an authenticated, ACTIVE
 * ENGINEER (checked here, and re-checked server-side again inside
 * link_line_account(), 077_line_notification_links.sql). Generates a
 * short-lived, HTTP-only `state` cookie for CSRF protection and redirects to
 * LINE's own consent screen; /auth/line/callback/route.ts verifies this
 * cookie against LINE's returned `state` before doing anything else.
 */
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const account = await getUserAccount(supabase, user.id);
  if (!account || account.role !== "ENGINEER" || account.status !== ACTIVE_STATUS) {
    // Not an eligible account for LINE notification linking -- send back to
    // Settings rather than starting a LINE consent flow that would only fail
    // server-side afterward.
    return NextResponse.redirect(`${origin}/engineer/settings?lineError=ineligible`);
  }

  const state = generateLineOAuthState();
  const redirectUri = `${origin}/auth/line/callback`;
  const authorizeUrl = buildLineAuthorizeUrl({ redirectUri, state });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(LINE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
