"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

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
  children: ReactNode;
}

/**
 * Optimistic client-side mirror of getUnreadBadgeCounts() (src/lib/dashboard/badges.ts).
 * Seeded from the server-computed counts at DashboardShell render, then
 * decremented instantly on read actions (notifications marked read, chat
 * threads opened) so the bell/message badges update with zero network wait
 * -- router.refresh() re-syncs the real server count shortly after as a
 * reconciliation safety net.
 */
export function UnreadCountsProvider({
  initialUnreadMessages,
  initialUnreadNotifications,
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
