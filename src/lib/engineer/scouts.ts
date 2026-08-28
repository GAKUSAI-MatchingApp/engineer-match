import type { SupabaseClient } from "@supabase/supabase-js";
import { listConversationMessages, type ConversationMessage } from "@/lib/engineer/chat";

/** public.scouts, per 082_scouts.sql. See src/lib/company/scouts.ts for the shared design notes. */
export type ScoutStatus = "pending" | "accepted" | "declined";

export interface ScoutListItem {
  id: string;
  companyUserId: string;
  companyName: string;
  message: string;
  status: ScoutStatus;
  opportunityId: string | null;
  opportunityTitle: string | null;
  createdAt: string;
  respondedAt: string | null;
  chatRoomId: string | null;
}

/** Every scout addressed to this engineer (scouts_select_participant RLS), newest first. */
export async function listMyScouts(
  supabase: SupabaseClient,
  engineerId: string,
): Promise<ScoutListItem[]> {
  const { data: rows, error } = await supabase
    .from("scouts")
    .select("id, company_user_id, message, status, opportunity_id, created_at, responded_at, chat_room_id")
    .eq("engineer_id", engineerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[engineer-scouts] failed to list scouts:", error);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  const companyIds = [...new Set(rows.map((row) => row.company_user_id as string))];
  const opportunityIds = [
    ...new Set(rows.map((row) => row.opportunity_id as string | null).filter((id): id is string => id !== null)),
  ];

  const [{ data: companies }, { data: opportunities }] = await Promise.all([
    supabase.from("company_profiles").select("id, company_name").in("id", companyIds),
    opportunityIds.length > 0
      ? supabase.from("opportunities").select("id, title").in("id", opportunityIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const companyNameById = new Map(
    (companies ?? []).map((row) => [row.id as string, row.company_name as string]),
  );
  const opportunityTitleById = new Map(
    (opportunities ?? []).map((row) => [row.id as string, row.title as string]),
  );

  return rows.map((row) => ({
    id: row.id as string,
    companyUserId: row.company_user_id as string,
    companyName: companyNameById.get(row.company_user_id as string) ?? "",
    message: row.message as string,
    status: row.status as ScoutStatus,
    opportunityId: row.opportunity_id as string | null,
    opportunityTitle: row.opportunity_id
      ? (opportunityTitleById.get(row.opportunity_id as string) ?? null)
      : null,
    createdAt: row.created_at as string,
    respondedAt: row.responded_at as string | null,
    chatRoomId: row.chat_room_id as string | null,
  }));
}

/**
 * Calls the respond_to_scout() SECURITY DEFINER RPC. Ownership (must be the
 * scout's own engineer_id) and idempotency (must still be pending) are
 * enforced server-side. Returns the new chat_room_id when accepted, null
 * when declined.
 */
export async function respondToScout(
  supabase: SupabaseClient,
  scoutId: string,
  response: "accepted" | "declined",
): Promise<{ chatRoomId: string | null; error: { code?: string; message: string } | null }> {
  const { data, error } = await supabase.rpc("respond_to_scout", {
    p_scout_id: scoutId,
    p_response: response,
  });

  if (error) {
    return { chatRoomId: null, error: { code: (error as { code?: string }).code, message: error.message } };
  }

  return { chatRoomId: (data as string | null) ?? null, error: null };
}

export interface EngineerScoutConversationDetail {
  scoutId: string;
  chatRoomId: string;
  companyName: string;
  messages: ConversationMessage[];
  messageLoadError: boolean;
}

/**
 * Loads the chat for an accepted scout, scoped to the engineer who received
 * it. Returns null for "not mine", "doesn't exist", or "not accepted yet" --
 * collapsed into one response (same convention as getOrCreateConversationForApplication).
 */
export async function getScoutConversationForEngineer(
  supabase: SupabaseClient,
  engineerId: string,
  scoutId: string,
): Promise<EngineerScoutConversationDetail | null> {
  const { data: scout, error } = await supabase
    .from("scouts")
    .select("id, engineer_id, company_user_id, status, chat_room_id")
    .eq("id", scoutId)
    .eq("engineer_id", engineerId)
    .maybeSingle();

  if (error) {
    console.error("[engineer-scouts] failed to load scout:", error);
    return null;
  }
  if (!scout || scout.status !== "accepted" || !scout.chat_room_id) return null;

  const { data: company } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("id", scout.company_user_id as string)
    .maybeSingle();

  const messageResult = await listConversationMessages(supabase, scout.chat_room_id as string);

  return {
    scoutId,
    chatRoomId: scout.chat_room_id as string,
    companyName: (company?.company_name as string) ?? "",
    messages: messageResult.messages,
    messageLoadError: messageResult.error !== null,
  };
}

/**
 * Maps a send_scout()/respond_to_scout() RPC error to a Japanese message
 * safe to show a user. Never surfaces error.message directly -- matching
 * mapEmailChangeError (src/lib/auth/email-change.ts). Matches on message
 * content (never rendered as-is) the same way classifyOpportunitySaveError
 * (src/lib/company/jobs.ts) already does for this codebase's other
 * multi-branch RPCs, since Postgres RAISE EXCEPTION codes are shared across
 * several distinct validation failures in 082_scouts.sql.
 */
export function mapScoutError(error: { code?: string; message?: string } | null): string {
  const message = error?.message?.toLowerCase() ?? "";

  if (error?.code === "23505" || message.includes("pending scout")) {
    return "このエンジニアには既に返信待ちのスカウトがあります。";
  }
  if (message.includes("cannot send a scout to yourself")) {
    return "自分自身にはスカウトを送信できません。";
  }
  if (message.includes("engineer not found or not active")) {
    return "対象のエンジニアが見つからないか、現在利用できません。";
  }
  if (message.includes("invalid scout message")) {
    return "スカウトメッセージを確認してください（1〜2000文字で入力してください）。";
  }
  if (message.includes("opportunity not found")) {
    return "選択した求人・案件が見つかりませんでした。";
  }
  if (message.includes("already been responded to")) {
    return "このスカウトは既に対応済みです。";
  }
  if (message.includes("scout not found")) {
    return "スカウトが見つかりませんでした。";
  }
  if (error?.code === "42501") {
    return "この操作を行う権限がありません。";
  }
  return "処理に失敗しました。しばらくしてから再度お試しください。";
}
