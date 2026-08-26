import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  LINE_OAUTH_STATE_COOKIE,
  checkLineBotFriendship,
  exchangeLineCodeForToken,
  fetchLineProfile,
} from "@/lib/line/client";

/**
 * LINE Login callback for the notification-linking flow started by
 * /auth/line/start/route.ts. Deliberately separate from /auth/oauth/callback
 * (Supabase Auth's Google/GitHub PKCE callback) -- this route never touches
 * a Supabase Auth session or identity, it only calls the
 * link_line_account() RPC (077_line_notification_links.sql) under the
 * caller's *existing* session.
 *
 * line_user_id is only ever taken from LINE's own token+profile endpoints
 * (server-to-server), never from a query param or client-supplied value --
 * link_line_account() trusts its p_line_user_id argument specifically
 * because this is the one caller that verifies it first.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const providerError = searchParams.get("error");

  function toSettings(query: string) {
    const response = NextResponse.redirect(`${origin}/engineer/settings?${query}`);
    response.cookies.delete(LINE_OAUTH_STATE_COOKIE);
    return response;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (providerError) {
    console.error("[auth/line/callback] LINE returned an error:", providerError);
    return toSettings("lineError=denied");
  }

  const cookieState = request.cookies.get(LINE_OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    console.error("[auth/line/callback] missing code or state mismatch");
    return toSettings("lineError=state_mismatch");
  }

  try {
    const redirectUri = `${origin}/auth/line/callback`;
    const accessToken = await exchangeLineCodeForToken({ code, redirectUri });
    const profile = await fetchLineProfile(accessToken);
    const isActive = await checkLineBotFriendship(profile.userId);

    const { error } = await supabase.rpc("link_line_account", {
      p_line_user_id: profile.userId,
      p_display_name: profile.displayName,
      p_picture_url: profile.pictureUrl,
      p_is_active: isActive,
    });

    if (error) {
      console.error("[auth/line/callback] link_line_account failed:", error);
      if ((error as { code?: string }).code === "23505") {
        return toSettings("lineError=already_linked");
      }
      return toSettings("lineError=failed");
    }

    return toSettings(`lineLinked=1&active=${isActive ? "1" : "0"}`);
  } catch (err) {
    console.error("[auth/line/callback] unexpected failure:", err);
    return toSettings("lineError=failed");
  }
}
