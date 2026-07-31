import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDateJa } from "@/lib/engineer/format";

function formatDateTimeLabel(iso: string): string {
  const date = new Date(iso);
  return `${formatDateJa(iso)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export interface AdminConversationListItem {
  id: string;
  engineerId: string;
  engineerName: string;
  companyId: string;
  companyName: string;
  opportunityId: string;
  opportunityTitle: string;
  lastMessageBody: string | null;
  lastMessageAtLabel: string;
  messageCount: number;
  updatedAtISO: string;
}

const LIST_CAP = 500;

/**
 * Real chat_rooms/messages data. No moderation metadata exists in the
 * schema (no report count, handling status, or restriction flag on either
 * table) -- this is read-only monitoring only, matching the admin SELECT
 * RLS on both tables (no admin UPDATE policy on messages by design).
 */
export async function listAdminConversations(supabase: SupabaseClient): Promise<AdminConversationListItem[]> {
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select("id, application_id, engineer_id, company_user_id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(LIST_CAP);

  if (error) {
    console.error("[admin] failed to list conversations:", error);
    return [];
  }
  if (!rooms || rooms.length === 0) return [];

  const applicationIds = rooms.map((r) => r.application_id as string);
  const engineerIds = [...new Set(rooms.map((r) => r.engineer_id as string))];
  const companyIds = [...new Set(rooms.map((r) => r.company_user_id as string))];
  const roomIds = rooms.map((r) => r.id as string);

  const [{ data: applications }, { data: engineers }, { data: companies }, { data: messages }] = await Promise.all([
    supabase.from("applications").select("id, opportunity_id").in("id", applicationIds),
    supabase.from("users").select("id, name").in("id", engineerIds),
    supabase.from("company_profiles").select("id, company_name").in("id", companyIds),
    supabase.from("messages").select("chat_room_id, body, sent_at").in("chat_room_id", roomIds),
  ]);

  const oppIdByAppId = new Map((applications ?? []).map((a) => [a.id as string, a.opportunity_id as string]));
  const oppIds = [...new Set(Array.from(oppIdByAppId.values()))];
  const { data: opportunities } =
    oppIds.length > 0
      ? await supabase.from("opportunities").select("id, title").in("id", oppIds)
      : { data: [] as { id: string; title: string }[] };

  const engineerNameById = new Map((engineers ?? []).map((e) => [e.id as string, e.name as string]));
  const companyNameById = new Map((companies ?? []).map((c) => [c.id as string, c.company_name as string]));
  const oppTitleById = new Map((opportunities ?? []).map((o) => [o.id as string, o.title as string]));

  const messageCountByRoom = new Map<string, number>();
  const lastMessageByRoom = new Map<string, { body: string; sent_at: string }>();
  for (const m of messages ?? []) {
    const roomId = m.chat_room_id as string;
    messageCountByRoom.set(roomId, (messageCountByRoom.get(roomId) ?? 0) + 1);
    const existing = lastMessageByRoom.get(roomId);
    if (!existing || new Date(m.sent_at as string) > new Date(existing.sent_at)) {
      lastMessageByRoom.set(roomId, { body: m.body as string, sent_at: m.sent_at as string });
    }
  }

  return rooms.map((room) => {
    const oppId = oppIdByAppId.get(room.application_id as string) ?? "";
    const last = lastMessageByRoom.get(room.id as string);
    return {
      id: room.id as string,
      engineerId: room.engineer_id as string,
      engineerName: engineerNameById.get(room.engineer_id as string) ?? "不明なユーザー",
      companyId: room.company_user_id as string,
      companyName: companyNameById.get(room.company_user_id as string) ?? "",
      opportunityId: oppId,
      opportunityTitle: oppTitleById.get(oppId) ?? "（求人情報なし）",
      lastMessageBody: last?.body ?? null,
      lastMessageAtLabel: last ? formatDateTimeLabel(last.sent_at) : formatDateTimeLabel(room.updated_at as string),
      messageCount: messageCountByRoom.get(room.id as string) ?? 0,
      updatedAtISO: room.updated_at as string,
    };
  });
}

export interface AdminConversationMessage {
  id: string;
  senderId: string;
  senderName: string;
  isEngineer: boolean;
  body: string;
  sentAtLabel: string;
}

export interface AdminConversationDetail extends AdminConversationListItem {
  applicationId: string;
  messages: AdminConversationMessage[];
}

export async function getAdminConversationDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<AdminConversationDetail | null> {
  const { data: room, error } = await supabase
    .from("chat_rooms")
    .select("id, application_id, engineer_id, company_user_id, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] failed to load conversation detail:", error);
    return null;
  }
  if (!room) return null;

  const [{ data: application }, { data: engineer }, { data: company }, { data: messageRows }] = await Promise.all([
    supabase.from("applications").select("opportunity_id").eq("id", room.application_id as string).maybeSingle(),
    supabase.from("users").select("name").eq("id", room.engineer_id as string).maybeSingle(),
    supabase.from("company_profiles").select("company_name").eq("id", room.company_user_id as string).maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, body, sent_at")
      .eq("chat_room_id", id)
      .order("sent_at", { ascending: true }),
  ]);

  const oppId = (application?.opportunity_id as string | undefined) ?? "";
  let opportunityTitle = "（求人情報なし）";
  if (oppId) {
    const { data: opportunity } = await supabase.from("opportunities").select("title").eq("id", oppId).maybeSingle();
    opportunityTitle = (opportunity?.title as string | undefined) ?? opportunityTitle;
  }

  const engineerName = (engineer?.name as string | undefined) ?? "不明なユーザー";
  const companyName = (company?.company_name as string | undefined) ?? "";
  const rows = messageRows ?? [];
  const last = rows[rows.length - 1];

  return {
    id: room.id as string,
    engineerId: room.engineer_id as string,
    engineerName,
    companyId: room.company_user_id as string,
    companyName,
    opportunityId: oppId,
    opportunityTitle,
    lastMessageBody: last ? (last.body as string) : null,
    lastMessageAtLabel: last
      ? formatDateTimeLabel(last.sent_at as string)
      : formatDateTimeLabel(room.updated_at as string),
    messageCount: rows.length,
    updatedAtISO: room.updated_at as string,
    applicationId: room.application_id as string,
    messages: rows.map((m) => ({
      id: m.id as string,
      senderId: m.sender_id as string,
      senderName: m.sender_id === room.engineer_id ? engineerName : companyName,
      isEngineer: m.sender_id === room.engineer_id,
      body: m.body as string,
      sentAtLabel: formatDateTimeLabel(m.sent_at as string),
    })),
  };
}
