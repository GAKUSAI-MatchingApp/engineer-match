"use client";

import Link from "next/link";
import { Award, FileText, Info, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  COMPANY_NOTIFICATION_ACTIONS_LABELS,
  COMPANY_NOTIFICATION_TYPE_LABELS,
  COMPANY_NOTIFICATION_TYPE_STYLES,
} from "@/constants/company-notifications";
import { formatDateJa } from "@/lib/engineer/format";
import type { NotificationItem } from "@/lib/engineer/notifications";

const ICON_MAP: Record<string, LucideIcon> = {
  application_received: FileText,
  application_status_changed: Award,
  new_message: MessageSquare,
  opportunity_closed: Info,
};

/** Real-data link target for a notification, based on its related entity. */
function linkFor(notification: NotificationItem): string {
  if (notification.relatedEntityType === "chat_room" && notification.relatedEntityId) {
    if (notification.relatedApplicationId) return `/company/messages/${notification.relatedApplicationId}`;
    // Scout-originated room (application_id IS NULL, 082_scouts.sql) --
    // /company/messages excludes these, so route to the dedicated scout
    // chat page instead of a dead-end list.
    if (notification.relatedScoutId) return `/company/messages/scout/${notification.relatedScoutId}`;
    return "/company/messages";
  }
  if (notification.relatedEntityType === "engineer_review") {
    // The review (and any engineer reply) is shown on the applicant detail
    // page (ApplicantReviewSection), keyed by application id.
    return notification.relatedApplicationId
      ? `/company/applicants/${notification.relatedApplicationId}`
      : "/company/applicants";
  }
  return "/company/applicants";
}

interface CompanyNotificationCardProps {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
}

export function CompanyNotificationCard({
  notification,
  onMarkRead,
}: CompanyNotificationCardProps) {
  const Icon = ICON_MAP[notification.type] ?? Info;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors duration-200 ${
        notification.isRead ? "border-border bg-surface" : "border-primary/20 bg-primary/5"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${COMPANY_NOTIFICATION_TYPE_STYLES[notification.type]}`}
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
              aria-label={COMPANY_NOTIFICATION_ACTIONS_LABELS.unreadLabel}
            />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${COMPANY_NOTIFICATION_TYPE_STYLES[notification.type]}`}
          >
            {COMPANY_NOTIFICATION_TYPE_LABELS[notification.type]}
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
                {COMPANY_NOTIFICATION_ACTIONS_LABELS.markReadLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
