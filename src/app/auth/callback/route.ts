import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges a Supabase PKCE `code` for a session, then sends the user to set
 * their new password. Password recovery is the only flow that lands here
 * today, so the destination is fixed rather than taken from a `next` query
 * param — Supabase's redirect_to allow-list matching does not reliably
 * preserve extra query params appended to the registered callback URL, which
 * previously caused successful recovery logins to fall through to `/login`
 * (and from there straight to the dashboard) instead of `/reset-password`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
