import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * public.notifications, per 013_notifications.sql. type is a real enum
 * (chk_notifications_type) -- there is no client-facing INSERT policy
 * (027_notification_favorite_policies.sql: system-generated only). Real
 * producers today: private.notify_new_message() (new chat messages,
 * 036_chat_mvp_and_message_notifications.sql) and
 * private.notify_new_review() / private.notify_new_review_reply() (Engineer
 * Review/Rating System, 050_engineer_reviews.sql). application_received /
 * application_status_changed / opportunity_closed still have no producer.
 */
export type NotificationType =
  | "application_received"
  | "application_status_changed"
  | "new_message"
  | "opportunity_closed"
  | "review_received"
  | "review_reply_received";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  relatedApplicationId: string | null;
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
          .select("id, application_id")
          .in("id", chatRoomIds)
      : { data: [] as { id: string; application_id: string }[] };
  const applicationIdByChatRoom = new Map(
    (chatRooms ?? []).map((row) => [row.id as string, row.application_id as string]),
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    relatedApplicationId: row.related_entity_id
      ? (applicationIdByChatRoom.get(row.related_entity_id) ?? null)
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
