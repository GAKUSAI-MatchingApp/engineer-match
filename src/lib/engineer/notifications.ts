import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * public.notifications, per 013_notifications.sql. type is a real enum
 * (chk_notifications_type) -- there is no client-facing INSERT policy
 * (027_notification_favorite_policies.sql: system-generated only). Real
 * producers today: private.notify_new_message() (new chat messages,
 * 036_chat_mvp_and_message_notifications.sql), private.notify_new_review() /
 * private.notify_new_review_reply() (Engineer Review/Rating System,
 * 050_engineer_reviews.sql), and private.notify_scout_received() (new
 * scouts, 082_scouts.sql). application_received / application_status_changed /
 * opportunity_closed still have no producer.
 */
export type NotificationType =
  | "application_received"
  | "application_status_changed"
  | "new_message"
  | "opportunity_closed"
  | "review_received"
  | "review_reply_received"
  | "scout_received";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  relatedApplicationId: string | null;
  /** Set only for a chat_room whose messages notification points at a scout-originated room (application_id IS NULL, 082_scouts.sql). */
  relatedScoutId: string | null;
  isRead: boolean;
  createdAt: string;
}

/** The caller's own notifications, newest first (notifications_select_own RLS). */
export async function listMyNotifications(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, related_entity_type, related_entity_id, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[engineer-notifications] failed to list notifications:", error);
    return [];
  }

  const rows = (data ?? []) as {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    related_entity_type: string | null;
    related_entity_id: string | null;
    is_read: boolean;
    created_at: string;
  }[];

  const chatRoomIds = [
    ...new Set(
      rows
        .filter(
          (row) => row.related_entity_type === "chat_room" && row.related_entity_id,
        )
        .map((row) => row.related_entity_id as string),
    ),
  ];
  const { data: chatRooms } =
    chatRoomIds.length > 0
      ? await supabase
          .from("chat_rooms")
          .select("id, application_id, scout_id")
          .in("id", chatRoomIds)
      : { data: [] as { id: string; application_id: string | null; scout_id: string | null }[] };
  const applicationIdByChatRoom = new Map(
    (chatRooms ?? []).map((row) => [row.id as string, row.application_id as string | null]),
  );
  // scout-originated room (application_id IS NULL, 082_scouts.sql) -- resolved
  // so a new_message notification for a scout chat deep-links to
  // /messages/scout/[scoutId] instead of falling through to the generic
  // /messages list, which excludes scout rooms (see listMyConversations).
  const scoutIdByChatRoom = new Map(
    (chatRooms ?? []).map((row) => [row.id as string, row.scout_id as string | null]),
  );

  // review_received / review_reply_received notifications point at an
  // engineer_reviews row (related_entity_type: "engineer_review") -- resolve
  // it to the underlying application_id too, same as chat_room above, so the
  // notification card can deep-link a company to /company/applicants/[id]
  // (ApplicantReviewSection) instead of the generic applicant list.
  const reviewIds = [
    ...new Set(
      rows
        .filter(
          (row) => row.related_entity_type === "engineer_review" && row.related_entity_id,
        )
        .map((row) => row.related_entity_id as string),
    ),
  ];
  const { data: reviews } =
    reviewIds.length > 0
      ? await supabase
          .from("engineer_reviews")
          .select("id, application_id")
          .in("id", reviewIds)
      : { data: [] as { id: string; application_id: string }[] };
  const applicationIdByReview = new Map(
    (reviews ?? []).map((row) => [row.id as string, row.application_id as string]),
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    relatedApplicationId: row.related_entity_id
      ? (applicationIdByChatRoom.get(row.related_entity_id) ??
        applicationIdByReview.get(row.related_entity_id) ??
        null)
      : null,
    relatedScoutId: row.related_entity_id
      ? (scoutIdByChatRoom.get(row.related_entity_id) ?? null)
      : null,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function markNotificationRead(supabase: SupabaseClient, id: string) {
  return supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();
}

export async function markAllNotificationsRead(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);
}
