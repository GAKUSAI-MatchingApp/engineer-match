import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listConversationActivityRows,
  listConversationMessages,
} from "@/lib/engineer/chat";

/**
 * Company-side mirror of src/lib/engineer/chat.ts. Same public.chat_rooms /
 * public.messages tables (012_chat.sql), same one-room-per-application
 * design -- just queried from the company_user_id side instead of
 * engineer_id, and joining public.users (engineer display name) instead of
 * public.company_profiles. sendMessage()/markConversationRead() are fully
 * generic (chatRoomId + sender/viewer id, no role assumption), so they are
 * reused as-is from src/lib/engineer/chat.ts rather than duplicated here.
 */
export interface CompanyConversationListItem {
  chatRoomId: string;
  applicationId: string;
  engineerName: string;
  opportunityTitle: string;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

/** Every chat_room the company is a participant in (chat_rooms_select_participant RLS). */
export async function listCompanyConversations(
  supabase: SupabaseClient,
  companyUserId: string,
): Promise<CompanyConversationListItem[]> {
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select("id, application_id, engineer_id")
    .eq("company_user_id", companyUserId)
    // Review #24 (082_scouts.sql): application_id is now nullable for
    // scout-originated rooms (scout_id set instead). Excluded here for the
    // same reason as listMyConversations() (src/lib/engineer/chat.ts) --
    // this list assumes application_id is always a real row.
    .not("application_id", "is", null);

  if (error) {
    console.error("[company-chat] failed to list chat rooms:", error);
    return [];
  }
  if (!rooms || rooms.length === 0) return [];

  const roomIds = rooms.map((r) => r.id as string);
  const applicationIds = rooms.map((r) => r.application_id as string);
  const engineerIds = [...new Set(rooms.map((r) => r.engineer_id as string))];

  const [{ data: applications }, { data: engineers }, messages] = await Promise.all([
    supabase.from("applications").select("id, opportunity_id").in("id", applicationIds),
    supabase.from("users").select("id, name").in("id", engineerIds),
    listConversationActivityRows(supabase, roomIds),
  ]);

  const opportunityIds = [
    ...new Set((applications ?? []).map((a) => a.opportunity_id as string)),
  ];
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, title")
    .in("id", opportunityIds);

  const opportunityIdByApplication = new Map(
    (applications ?? []).map((a) => [a.id as string, a.opportunity_id as string]),
  );
  const opportunityTitleById = new Map(
    (opportunities ?? []).map((o) => [o.id as string, o.title as string]),
  );
  const engineerNameById = new Map(
    (engineers ?? []).map((e) => [e.id as string, e.name as string]),
  );

  const lastMessageByRoom = new Map<string, { body: string; sent_at: string }>();
  const unreadCountByRoom = new Map<string, number>();
  for (const row of messages) {
    if (!lastMessageByRoom.has(row.chat_room_id)) {
      lastMessageByRoom.set(row.chat_room_id, { body: row.body, sent_at: row.sent_at });
    }
    if (row.sender_id !== companyUserId && row.read_at === null) {
      unreadCountByRoom.set(row.chat_room_id, (unreadCountByRoom.get(row.chat_room_id) ?? 0) + 1);
    }
  }

  return rooms
    .map((room) => {
      const opportunityId = opportunityIdByApplication.get(room.application_id as string);
      const last = lastMessageByRoom.get(room.id as string);
      return {
        chatRoomId: room.id as string,
        applicationId: room.application_id as string,
        engineerName: engineerNameById.get(room.engineer_id as string) ?? "",
        opportunityTitle: opportunityId ? (opportunityTitleById.get(opportunityId) ?? "") : "",
        lastMessageBody: last?.body ?? null,
        lastMessageAt: last?.sent_at ?? null,
        unreadCount: unreadCountByRoom.get(room.id as string) ?? 0,
      };
    })
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

export interface CompanyConversationMessage {
  id: string;
  senderId: string;
  body: string;
  sentAt: string;
  readAt: string | null;
}

export interface CompanyConversationDetail {
  chatRoomId: string;
  applicationId: string;
  applicationStatus: string;
  opportunityId: string;
  engineerName: string;
  opportunityTitle: string;
  contractType: string;
  messages: CompanyConversationMessage[];
  messageLoadError: boolean;
}

/**
 * Loads the conversation for one of the company's own opportunities'
 * applications, creating the chat_room row on first use if it doesn't exist
 * yet -- mirrors getOrCreateConversationForApplication(), using the
 * company-side participant-scoped INSERT policy from
 * 036_chat_mvp_and_message_notifications.sql. Returns null uniformly for
 * "not my opportunity's application" and "doesn't exist".
 */
export async function getOrCreateCompanyConversationForApplication(
  supabase: SupabaseClient,
  companyUserId: string,
  applicationId: string,
): Promise<CompanyConversationDetail | null> {
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, opportunity_id, applicant_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError) {
    console.error("[company-chat] failed to load application:", applicationError);
    return null;
  }
  if (!application) return null;

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, title, posted_by, contract_type")
    .eq("id", application.opportunity_id)
    .eq("posted_by", companyUserId)
    .maybeSingle();

  if (!opportunity) return null;

  const { data: engineer } = await supabase
    .from("users")
    .select("name")
    .eq("id", application.applicant_id)
    .maybeSingle();

  let { data: room } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (!room) {
    const { data: createdRoom, error: createError } = await supabase
      .from("chat_rooms")
      .insert({
        application_id: applicationId,
        engineer_id: application.applicant_id,
        company_user_id: companyUserId,
      })
      .select("id")
      .single();

    if (createError || !createdRoom) {
      console.error("[company-chat] failed to create chat room:", createError);
      return null;
    }
    room = createdRoom;
  }

  const messageResult = await listConversationMessages(supabase, room.id as string);

  return {
    chatRoomId: room.id as string,
    applicationId,
    applicationStatus: application.status as string,
    opportunityId: opportunity.id as string,
    engineerName: (engineer?.name as string) ?? "",
    opportunityTitle: (opportunity.title as string) ?? "",
    contractType: opportunity.contract_type as string,
    messages: messageResult.messages,
    messageLoadError: messageResult.error !== null,
  };
}

export {
  markConversationRead,
  sendMessage,
} from "@/lib/engineer/chat";
