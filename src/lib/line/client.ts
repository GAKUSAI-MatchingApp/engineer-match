import crypto from "node:crypto";

/**
 * Server-only utilities for two separate LINE surfaces:
 *   - LINE Login (client_id/secret = LINE_LOGIN_CHANNEL_*): used purely to
 *     obtain a verified line_user_id for an already-authenticated Engineer
 *     Match session. Never used for Supabase Auth sign-in.
 *   - Messaging API (channel access token/secret = LINE_MESSAGING_CHANNEL_*):
 *     used to check friendship status and push notification text.
 * Never import this from a "use client" file -- every function here reads
 * server-only env vars or calls LINE's servers directly.
 */

function requireLineEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}. See .env.example.`);
  }
  return value;
}

export const LINE_OAUTH_STATE_COOKIE = "line_oauth_state";

const LINE_AUTHORIZE_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";
const LINE_BOT_PROFILE_URL = "https://api.line.me/v2/bot/profile";
const LINE_PUSH_MESSAGE_URL = "https://api.line.me/v2/bot/message/push";

export function generateLineOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function buildLineAuthorizeUrl({
  redirectUri,
  state,
}: {
  redirectUri: string;
  state: string;
}): string {
  const clientId = requireLineEnv("LINE_LOGIN_CHANNEL_ID");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "profile openid",
    // Prompts the user to add the linked Messaging API official account as a
    // friend during the LINE consent screen. Not a guarantee -- the user can
    // still decline, or may unfollow/block later -- so link-time and webhook
    // friendship checks (checkLineBotFriendship / the follow/unfollow
    // handlers in src/app/api/line/webhook/route.ts) remain the source of
    // truth, never this param alone.
    bot_prompt: "aggressive",
  });
  return `${LINE_AUTHORIZE_URL}?${params.toString()}`;
}

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl: string | null;
}

/** Exchanges an authorization `code` from /auth/line/callback for an access_token. */
export async function exchangeLineCodeForToken({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}): Promise<string> {
  const clientId = requireLineEnv("LINE_LOGIN_CHANNEL_ID");
  const clientSecret = requireLineEnv("LINE_LOGIN_CHANNEL_SECRET");

  const response = await fetch(LINE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`LINE token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("LINE token exchange returned no access_token");
  }
  return data.access_token;
}

/**
 * Calls LINE Login's own /v2/profile with the access_token obtained above.
 * Preferred over parsing/verifying the id_token JWT ourselves -- this is a
 * direct authenticated call to LINE's server over TLS, so it carries the
 * same trust guarantee with far less implementation surface.
 */
export async function fetchLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`LINE profile fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  };

  return {
    userId: data.userId,
    displayName: data.displayName,
    pictureUrl: data.pictureUrl ?? null,
  };
}

/**
 * Whether lineUserId currently follows the linked Messaging API official
 * account. LINE returns 404 when the bot has no relationship with this user
 * (never followed, or has unfollowed/blocked) -- that is a normal "not a
 * friend" result, not an error, so it resolves to false rather than
 * throwing. Called synchronously once at link time (see
 * src/app/auth/line/callback/route.ts) specifically to cover the case where
 * the user already followed the OA *before* ever linking -- that case
 * produces no 'follow' webhook event, so relying on the webhook alone would
 * leave is_active stuck at false forever for those users.
 */
export async function checkLineBotFriendship(lineUserId: string): Promise<boolean> {
  const channelAccessToken = requireLineEnv("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN");

  const response = await fetch(`${LINE_BOT_PROFILE_URL}/${encodeURIComponent(lineUserId)}`, {
    headers: { Authorization: `Bearer ${channelAccessToken}` },
  });

  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`LINE bot profile check failed: ${response.status}`);
  }
  return true;
}

/** Pushes one plain-text message. Throws on any non-2xx response -- callers (src/app/api/line/dispatch/route.ts) are responsible for catching this and logging to line_dispatch_log rather than letting it propagate. */
export async function pushLineMessage(lineUserId: string, text: string): Promise<void> {
  const channelAccessToken = requireLineEnv("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN");

  const response = await fetch(LINE_PUSH_MESSAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      // notifications.title/body are VARCHAR(100)/VARCHAR(255) (013_notifications.sql),
      // far under the Messaging API text message limit -- this slice is just
      // a defensive cap, not expected to ever trigger.
      messages: [{ type: "text", text: text.slice(0, 2000) }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LINE push message failed: ${response.status} ${body}`);
  }
}

/**
 * Verifies the x-line-signature header on an incoming Messaging API webhook
 * request: LINE HMAC-SHA256-signs the raw request body with the Messaging
 * API channel secret and base64-encodes the result. Must run against the
 * raw (unparsed) body -- re-serializing parsed JSON can produce different
 * bytes and silently break the comparison, which is why
 * src/app/api/line/webhook/route.ts reads the body with request.text()
 * before ever calling JSON.parse.
 */
export function verifyLineWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;

  const channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET;
  if (!channelSecret) return false;

  const expected = crypto.createHmac("sha256", channelSecret).update(rawBody).digest("base64");

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signatureHeader);
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
