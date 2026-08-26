import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyLineWebhookSignature } from "@/lib/line/client";

/**
 * Messaging API webhook: receives 'follow'/'unfollow' events for the linked
 * official account and keeps line_notification_links.is_active in sync in
 * real time. This is the ongoing counterpart to the one-time synchronous
 * check in /auth/line/callback (checkLineBotFriendship) -- that call only
 * covers the moment of linking; this route covers every change afterward
 * (user adds/removes/blocks the OA later, independent of this app).
 *
 * Only 'follow'/'unfollow' are handled -- no auto-reply/rich-menu logic is
 * built here, matching the "one-way notification bot" scope agreed for
 * review #8. Uses the service-role client (bypasses RLS) since this is a
 * server-to-server call from LINE with no Supabase Auth session at all --
 * line_notification_links intentionally has no RLS write policy for any
 * role, so this is the only way this table is ever updated for a
 * follow/unfollow event.
 *
 * Always resolves 200 unless the signature itself is invalid, so LINE does
 * not enter a retry loop over an unrelated internal error; anything that
 * goes wrong past signature verification is logged, never thrown back to
 * the caller.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineWebhookSignature(rawBody, signature)) {
    console.error("[api/line/webhook] invalid or missing x-line-signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: { events?: Array<{ type: string; source?: { userId?: string } }> };
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("[api/line/webhook] failed to parse webhook body:", err);
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error("[api/line/webhook] service role client unavailable, skipping");
    return NextResponse.json({ ok: true });
  }

  for (const event of payload.events ?? []) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) continue;

    if (event.type === "follow") {
      const { error } = await admin
        .from("line_notification_links")
        .update({ is_active: true, last_followed_at: new Date().toISOString() })
        .eq("line_user_id", lineUserId);
      if (error) {
        console.error("[api/line/webhook] failed to record follow event:", error);
      }
    } else if (event.type === "unfollow") {
      const { error } = await admin
        .from("line_notification_links")
        .update({ is_active: false, last_unfollowed_at: new Date().toISOString() })
        .eq("line_user_id", lineUserId);
      if (error) {
        console.error("[api/line/webhook] failed to record unfollow event:", error);
      }
    }
    // Other event types (message, postback, etc.) are intentionally ignored.
  }

  return NextResponse.json({ ok: true });
}
