import type { SupabaseClient } from "@supabase/supabase-js";
import { listConversationMessages, type ConversationMessage } from "@/lib/engineer/chat";

export { mapScoutError } from "@/lib/engineer/scouts";

/**
 * public.scouts, per 082_scouts.sql. Scout-first flow: Company sends a scout
 * to an Engineer who has not applied to anything; only once the Engineer
 * accepts does a chat_room get created (respond_to_scout RPC). All writes go
 * through SECURITY DEFINER RPCs (send_scout / respond_to_scout) -- scouts has
 * no client-facing INSERT/UPDATE policy, so this module never issues a raw
 * .insert()/.update() against it.
 */
export type ScoutStatus = "pending" | "accepted" | "declined";

export interface ScoutStatusInfo {
  id: string;
  status: ScoutStatus;
  message: string;
  createdAt: string;
  respondedAt: string | null;
  chatRoomId: string | null;
}

/**
 * The most recent scout this company has sent to this engineer, regardless
 * of status -- used by the Engineer detail page to decide what to render
 * instead of the send form (already pending / accepted with a chat link /
 * declined) once one exists.
 */
export async function getScoutStatusForEngineer(
  supabase: SupabaseClient,
  companyUserId: string,
  engineerId: string,
): Promise<ScoutStatusInfo | null> {
  const { data, error } = await supabase
    .from("scouts")
    .select("id, status, message, created_at, responded_at, chat_room_id")
    .eq("company_user_id", companyUserId)
    .eq("engineer_id", engineerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[company-scouts] failed to load scout status:", error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id as string,
    status: data.status as ScoutStatus,
    message: data.message as string,
    createdAt: data.created_at as string,
    respondedAt: data.responded_at as string | null,
    chatRoomId: data.chat_room_id as string | null,
  };
}

export interface SendScoutInput {
  engineerId: string;
  message: string;
  opportunityId: string | null;
}

/** Calls the send_scout() SECURITY DEFINER RPC (082_scouts.sql). Every business rule (ACTIVE company, ACTIVE engineer, not-self, duplicate-pending) is enforced server-side; this is just the thin client-side call. */
export async function sendScout(
  supabase: SupabaseClient,
  input: SendScoutInput,
): Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }> {
  const { data, error } = await supabase.rpc("send_scout", {
    p_engineer_id: input.engineerId,
    p_message: input.message,
    p_opportunity_id: input.opportunityId,
  });

  if (error) {
    return { data: null, error: { code: (error as { code?: string }).code, message: error.message } };
  }

  return { data: { id: data as string }, error: null };
}

export interface CompanyScoutConversationDetail {
  scoutId: string;
  chatRoomId: string;
  engineerName: string;
  messages: ConversationMessage[];
  messageLoadError: boolean;
}

/**
 * Loads the chat for an accepted scout, scoped to the company that sent it.
 * Returns null for "not mine", "doesn't exist", or "not accepted yet" --
 * collapsed into one response, matching this codebase's existing convention
 * (e.g. getCompanyOpportunity) of never distinguishing those cases to the
 * caller.
 */
export async function getScoutConversationForCompany(
  supabase: SupabaseClient,
  companyUserId: string,
  scoutId: string,
): Promise<CompanyScoutConversationDetail | null> {
  const { data: scout, error } = await supabase
    .from("scouts")
    .select("id, engineer_id, company_user_id, status, chat_room_id")
    .eq("id", scoutId)
    .eq("company_user_id", companyUserId)
    .maybeSingle();

  if (error) {
    console.error("[company-scouts] failed to load scout:", error);
    return null;
  }
  if (!scout || scout.status !== "accepted" || !scout.chat_room_id) return null;

  const { data: engineer } = await supabase
    .from("users")
    .select("name")
    .eq("id", scout.engineer_id as string)
    .maybeSingle();

  const messageResult = await listConversationMessages(supabase, scout.chat_room_id as string);

  return {
    scoutId,
    chatRoomId: scout.chat_room_id as string,
    engineerName: (engineer?.name as string) ?? "",
    messages: messageResult.messages,
    messageLoadError: messageResult.error !== null,
  };
}
