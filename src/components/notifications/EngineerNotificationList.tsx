"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Layers } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { EngineerNotificationCard } from "@/components/notifications/EngineerNotificationCard";
import { EngineerNotificationEmptyState } from "@/components/notifications/EngineerNotificationEmptyState";
import { useUnreadCounts } from "@/components/dashboard/UnreadCountsProvider";
import {
  ENGINEER_NOTIFICATION_ACTIONS_LABELS,
  ENGINEER_NOTIFICATION_FILTER_OPTIONS,
  ENGINEER_NOTIFICATION_SUMMARY_LABELS,
  type EngineerNotificationFilter,
} from "@/constants/engineer-notifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/engineer/notifications";
import { createClient } from "@/lib/supabase/client";

interface EngineerNotificationListProps {
  initialNotifications: NotificationItem[];
}

export function EngineerNotificationList({
  initialNotifications,
}: EngineerNotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<EngineerNotificationFilter>("all");
  const router = useRouter();
  const { decrementNotifications } = useUnreadCounts();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  async function handleMarkRead(id: string) {
    const wasUnread = notifications.some((n) => n.id === id && !n.isRead);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (wasUnread) {
      decrementNotifications();
      router.refresh();
    }

    const supabase = createClient();
    const { error } = await markNotificationRead(supabase, id);
    if (error) {
      console.error("[engineer-notifications] failed to mark read:", error);
    }
  }

  async function handleMarkAllRead() {
    const unreadIds = new Set(notifications.filter((n) => !n.isRead).map((n) => n.id));
    setNotifications((prev) => prev.map((n) => (unreadIds.has(n.id) ? { ...n, isRead: true } : n)));
    if (unreadIds.size > 0) {
      decrementNotifications(unreadIds.size);
      router.refresh();
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await markAllNotificationsRead(supabase, user.id);
    if (error) {
      console.error("[engineer-notifications] failed to mark all read:", error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:w-fit sm:grid-cols-2">
        <StatCard
          label={ENGINEER_NOTIFICATION_SUMMARY_LABELS.unread}
          value={String(unreadCount)}
          icon={Bell}
        />
        <StatCard
          label={ENGINEER_NOTIFICATION_SUMMARY_LABELS.all}
          value={String(notifications.length)}
          icon={Layers}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="通知の絞り込み">
            {ENGINEER_NOTIFICATION_FILTER_OPTIONS.map((option) => {
              const isActive = option.value === filter;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setFilter(option.value)}
                  className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ENGINEER_NOTIFICATION_ACTIONS_LABELS.markAllReadLabel}
          </button>
        </div>

        {filtered.length === 0 ? (
          <EngineerNotificationEmptyState />
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((notification) => (
              <li key={notification.id}>
                <EngineerNotificationCard notification={notification} onMarkRead={handleMarkRead} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
