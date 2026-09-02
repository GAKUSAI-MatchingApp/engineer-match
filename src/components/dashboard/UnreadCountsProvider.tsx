"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

interface UnreadCountsContextValue {
  unreadMessages: number;
  unreadNotifications: number;
  decrementMessages: (by?: number) => void;
  decrementNotifications: (by?: number) => void;
}

const UnreadCountsContext = createContext<UnreadCountsContextValue | null>(null);

interface UnreadCountsProviderProps {
  initialUnreadMessages: number;
  initialUnreadNotifications: number;
  /** Needed to filter the live notifications subscription below to just this
   *  user's own rows. Null when signed out -- no subscription is created. */
  userId?: string | null;
  children: ReactNode;
}

/**
 * Optimistic client-side mirror of getUnreadBadgeCounts() (src/lib/dashboard/badges.ts).
 * Seeded from the server-computed counts at DashboardShell render, then
 * decremented instantly on read actions (notifications marked read, chat
 * threads opened) so the bell/message badges update with zero network wait
 * -- router.refresh() re-syncs the real server count shortly after as a
 * reconciliation safety net.
 *
 * Also subscribes to Supabase Realtime for new `notifications` rows (every
 * new chat message, application update, review, and scout inserts one) so
 * both badges climb live too, without waiting for a page refresh.
 */
export function UnreadCountsProvider({
  initialUnreadMessages,
  initialUnreadNotifications,
  userId = null,
  children,
}: UnreadCountsProviderProps) {
  const [unreadMessages, setUnreadMessages] = useState(initialUnreadMessages);
  const [unreadNotifications, setUnreadNotifications] = useState(initialUnreadNotifications);

  const decrementMessages = useCallback((by: number = 1) => {
    setUnreadMessages((prev) => Math.max(0, prev - by));
  }, []);

  const decrementNotifications = useCallback((by: number = 1) => {
    setUnreadNotifications((prev) => Math.max(0, prev - by));
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-badges-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { type: string };
          setUnreadNotifications((prev) => prev + 1);
          // Every new_message notification corresponds 1:1 with one new
          // unread message row, so this alone keeps the "メッセージ" badge
          // live too -- no separate messages-table subscription needed just
          // for the badge count (ChatMessageThread's own subscription still
          // handles showing the message bubble inside an open thread).
          if (row.type === "new_message") {
            setUnreadMessages((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <UnreadCountsContext.Provider
      value={{ unreadMessages, unreadNotifications, decrementMessages, decrementNotifications }}
    >
      {children}
    </UnreadCountsContext.Provider>
  );
}

export function useUnreadCounts(): UnreadCountsContextValue {
  const context = useContext(UnreadCountsContext);
  if (!context) {
    throw new Error("useUnreadCounts must be used within an UnreadCountsProvider");
  }
  return context;
}