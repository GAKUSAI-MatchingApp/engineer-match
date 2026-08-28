"use client";

import Link from "next/link";
import { Award, FileText, Info, Mail, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ENGINEER_NOTIFICATION_ACTIONS_LABELS,
  ENGINEER_NOTIFICATION_TYPE_LABELS,
  ENGINEER_NOTIFICATION_TYPE_STYLES,
} from "@/constants/engineer-notifications";
import { formatDateJa } from "@/lib/engineer/format";
import type { NotificationItem } from "@/lib/engineer/notifications";

const ICON_MAP: Record<string, LucideIcon> = {
  application_received: FileText,
  application_status_changed: Award,
  new_message: MessageSquare,
  opportunity_closed: Info,
  scout_received: Mail,
};

/** Real-data link target for a notification, based on its related entity. */
function linkFor(notification: NotificationItem): string {
  if (notification.relatedEntityType === "chat_room" && notification.relatedEntityId) {
    if (notification.relatedApplicationId) return `/messages/${notification.relatedApplicationId}`;
    // Scout-originated room (application_id IS NULL, 082_scouts.sql) --
    // /messages excludes these, so route to the dedicated scout chat page
    // instead of a dead-end list.
    if (notification.relatedScoutId) return `/messages/scout/${notification.relatedScoutId}`;
    return "/messages";
  }
  if (notification.relatedEntityType === "engineer_review") {
    // Reviews received by the engineer are shown on their own profile
    // (EngineerReviewsSection), not on the applications list.
    return "/engineer/profile";
  }
  if (notification.relatedEntityType === "scout" && notification.relatedEntityId) {
    // related_entity_id is the scout's own id (no extra resolution needed,
    // unlike chat_room -> applicationId above) -- anchor straight to its card.
    return `/engineer/scouts#scout-${notification.relatedEntityId}`;
  }
  return "/engineer/applications";
}

interface EngineerNotificationCardProps {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
}

export function EngineerNotificationCard({
  notification,
  onMarkRead,
}: EngineerNotificationCardProps) {
  const Icon = ICON_MAP[notification.type] ?? Info;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors duration-200 ${
        notification.isRead ? "border-border bg-surface" : "border-primary/20 bg-primary/5"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ENGINEER_NOTIFICATION_TYPE_STYLES[notification.type]}`}
        aria-hidden="true"
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <Link
            href={linkFor(notification)}
            className="min-w-0 flex-1 rounded-sm text-sm font-semibold text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {notification.title}
          </Link>
          {!notification.isRead && (
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
              aria-label={ENGINEER_NOTIFICATION_ACTIONS_LABELS.unreadLabel}
            />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${ENGINEER_NOTIFICATION_TYPE_STYLES[notification.type]}`}
          >
            {ENGINEER_NOTIFICATION_TYPE_LABELS[notification.type]}
          </span>
          <div className="flex items-center gap-3">
            <time className="text-[11px] whitespace-nowrap text-muted-foreground">
              {formatDateJa(notification.createdAt)}
            </time>
            {!notification.isRead && (
              <button
                type="button"
                onClick={() => onMarkRead(notification.id)}
                className="rounded-sm text-xs font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                {ENGINEER_NOTIFICATION_ACTIONS_LABELS.markReadLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
