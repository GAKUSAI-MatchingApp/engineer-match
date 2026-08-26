import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushLineMessage } from "@/lib/line/client";

/**
 * Actual LINE push execution, called from Postgres (via pg_net, once
 * migration 079 wires up the notifications AFTER INSERT trigger -- not
 * written yet, held for the pg_net-enable stop point) with
 * { notification_id }, authenticated by a shared secret rather than a
 * Supabase session (there is no user request context on this path).
 *
 * Deliberately re-checks is_enabled/is_active here even though the future
 * 079 trigger will already have checked them before ever calling this route
 * -- state can change between the trigger firing and this route executing
 * (e.g. the user unlinks in between), and this is the last point before an
 * actual LINE API call is made.
 *
 * Every failure mode here (bad secret, missing notification, LINE API
 * error) resolves as a *logged, non-throwing* outcome recorded in
 * line_dispatch_log -- this route must never surface an error in a way that
 * could make the calling trigger's transaction (i.e. the original
 * notifications INSERT) appear to have failed. It already didn't run inside
 * that transaction at all (pg_net dispatches asynchronously), but this keeps
 * that guarantee true end-to-end rather than just at the DB layer.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.LINE_DISPATCH_SHARED_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { notification_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const notificationId = body.notification_id;
  if (!notificationId) {
    return NextResponse.json({ error: "notification_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error("[api/line/dispatch] service role client unavailable, skipping");
    return NextResponse.json({ ok: true });
  }

  const { data: notification, error: notificationError } = await admin
    .from("notifications")
    .select("id, user_id, title, body")
    .eq("id", notificationId)
    .maybeSingle();

  if (notificationError || !notification) {
    console.error(
      "[api/line/dispatch] notification not found:",
      notificationId,
      notificationError,
    );
    return NextResponse.json({ ok: true });
  }

  const { data: link } = await admin
    .from("line_notification_links")
    .select("line_user_id, is_enabled, is_active")
    .eq("user_id", notification.user_id)
    .maybeSingle();

  if (!link || !link.is_enabled || !link.is_active) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Idempotency claim: a unique-violation here means another call already
  // claimed (or fully processed) this notification_id -- skip silently
  // rather than risk a duplicate push.
  const { error: claimError } = await admin
    .from("line_dispatch_log")
    .insert({ notification_id: notificationId, user_id: notification.user_id, status: "queued" });

  if (claimError) {
    if ((claimError as { code?: string }).code === "23505") {
      return NextResponse.json({ ok: true, skipped: true });
    }
    console.error("[api/line/dispatch] failed to claim dispatch log:", claimError);
    return NextResponse.json({ ok: true });
  }

  try {
    await pushLineMessage(link.line_user_id, `${notification.title}\n${notification.body}`);
    await admin
      .from("line_dispatch_log")
      .update({ status: "sent" })
      .eq("notification_id", notificationId);
  } catch (err) {
    console.error("[api/line/dispatch] push failed:", err);
    await admin
      .from("line_dispatch_log")
      .update({ status: "failed", error: err instanceof Error ? err.message : String(err) })
      .eq("notification_id", notificationId);
  }

  return NextResponse.json({ ok: true });
}
