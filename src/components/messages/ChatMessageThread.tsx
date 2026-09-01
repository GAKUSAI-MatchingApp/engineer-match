"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { ChatMessageBubble } from "@/components/messages/ChatMessageBubble";
import { ChatMessageComposer } from "@/components/messages/ChatMessageComposer";
import { ChatMessageHeader } from "@/components/messages/ChatMessageHeader";
import { useUnreadCounts } from "@/components/dashboard/UnreadCountsProvider";
import { formatDateJa } from "@/lib/engineer/format";
import {
  listConversationMessages,
  markConversationRead,
  sendMessage,
  type ConversationMessage,
} from "@/lib/engineer/chat";
import { createClient } from "@/lib/supabase/client";

interface ChatMessageThreadConversation {
  chatRoomId: string;
  applicationId: string;
  applicationStatus: string;
  opportunityId: string;
  opportunityTitle: string;
  contractType: string;
  messages: ConversationMessage[];
  messageLoadError: boolean;
}

interface ChatMessageThreadLabels {
  backLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  refreshError: string;
  ownSenderLabel: string;
  composer: {
    placeholder: string;
    sendLabel: string;
    sendingLabel: string;
    sendError: string;
    keyboardHint: string;
  };
}

interface ChatMessageThreadProps {
  conversation: ChatMessageThreadConversation;
  currentUserId: string;
  counterpartName: string;
  listHref: string;
  opportunityHref: string;
  applicationHref: string;
  inputId: string;
  logPrefix: string;
  labels: ChatMessageThreadLabels;
}

interface MessageDateGroup {
  dateLabel: string;
  items: ConversationMessage[];
}

function groupByDate(messages: ConversationMessage[]): MessageDateGroup[] {
  const groups: MessageDateGroup[] = [];
  for (const message of messages) {
    const dateLabel = formatDateJa(message.sentAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.dateLabel === dateLabel) {
      lastGroup.items.push(message);
    } else {
      groups.push({ dateLabel, items: [message] });
    }
  }
  return groups;
}

export function ChatMessageThread({
  conversation,
  currentUserId,
  counterpartName,
  listHref,
  opportunityHref,
  applicationHref,
  inputId,
  logPrefix,
  labels,
}: ChatMessageThreadProps) {
  const [messages, setMessages] = useState(conversation.messages);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(conversation.messageLoadError);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { decrementMessages, decrementNotifications } = useUnreadCounts();
  // Unread count at initial load -- the mount effect's markConversationRead
  // call marks exactly these as read, so this is what it decrements by.
  const [initialUnreadCount] = useState(
    () =>
      conversation.messages.filter((m) => m.senderId !== currentUserId && m.readAt === null)
        .length,
  );

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    markConversationRead(supabase, conversation.chatRoomId, currentUserId).then(
      ({ notificationsMarkedCount }) => {
        // Opening the thread directly (not via the bell) previously only
        // cleared the messages badge -- the related "new_message"
        // notification, and therefore the bell badge, was left stuck as
        // unread. markConversationRead now clears both, so mirror that here.
        if (initialUnreadCount > 0) decrementMessages(initialUnreadCount);
        if (notificationsMarkedCount > 0) decrementNotifications(notificationsMarkedCount);
        if (initialUnreadCount > 0 || notificationsMarkedCount > 0) router.refresh();
      },
    );
  }, [
    conversation.chatRoomId,
    currentUserId,
    initialUnreadCount,
    decrementMessages,
    decrementNotifications,
    router,
  ]);

  async function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(false);

    try {
      const supabase = createClient();
      const result = await listConversationMessages(supabase, conversation.chatRoomId);
      if (result.error) {
        setRefreshError(true);
        return;
      }

      setMessages((previous) => {
        const refreshedById = new Map(result.messages.map((message) => [message.id, message]));
        for (const message of previous) {
          if (!refreshedById.has(message.id)) refreshedById.set(message.id, message);
        }
        return [...refreshedById.values()].sort(
          (left, right) =>
            left.sentAt.localeCompare(right.sentAt) || left.id.localeCompare(right.id),
        );
      });

      const unreadCount = result.messages.filter(
        (m) => m.senderId !== currentUserId && m.readAt === null,
      ).length;
      const { notificationsMarkedCount } = await markConversationRead(
        supabase,
        conversation.chatRoomId,
        currentUserId,
      );
      if (unreadCount > 0) decrementMessages(unreadCount);
      if (notificationsMarkedCount > 0) decrementNotifications(notificationsMarkedCount);
      if (unreadCount > 0 || notificationsMarkedCount > 0) router.refresh();
    } catch (error) {
      console.error(`[${logPrefix}] failed to refresh messages:`, error);
      setRefreshError(true);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSend(content: string): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await sendMessage(
      supabase,
      conversation.chatRoomId,
      currentUserId,
      content,
    );
    if (error || !data) {
      console.error(`[${logPrefix}] failed to send message:`, error);
      return false;
    }

    const sentMessage: ConversationMessage = {
      id: data.id as string,
      senderId: data.sender_id as string,
      body: data.body as string,
      sentAt: data.sent_at as string,
      readAt: data.read_at as string | null,
    };
    setMessages((previous) =>
      previous.some((message) => message.id === sentMessage.id)
        ? previous
        : [...previous, sentMessage],
    );
    return true;
  }

  const groups = groupByDate(messages);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <ChatMessageHeader
        counterpartName={counterpartName}
        opportunityTitle={conversation.opportunityTitle}
        applicationStatus={conversation.applicationStatus}
        contractType={conversation.contractType}
        listHref={listHref}
        opportunityHref={opportunityHref}
        applicationHref={applicationHref}
        backLabel={labels.backLabel}
        isRefreshing={isRefreshing}
        onRefresh={() => void handleRefresh()}
      />

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-4 sm:px-6">
        {refreshError && (
          <div
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            role="alert"
          >
            <span>{labels.refreshError}</span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="shrink-0 rounded font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
            >
              再試行
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 px-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{labels.emptyTitle}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {labels.emptyDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col" aria-live="polite">
            {groups.map((group) => (
              <div key={group.dateLabel} className="mb-4 flex min-w-0 flex-col">
                <div className="mb-2 flex justify-center">
                  <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                    {group.dateLabel}
                  </span>
                </div>
                {group.items.map((message, index) => {
                  const previous = group.items[index - 1];
                  const isOwnMessage = message.senderId === currentUserId;
                  return (
                    <ChatMessageBubble
                      key={message.id}
                      body={message.body}
                      sentAt={message.sentAt}
                      isOwnMessage={isOwnMessage}
                      senderLabel={isOwnMessage ? labels.ownSenderLabel : counterpartName}
                      isGroupedWithPrevious={previous?.senderId === message.senderId}
                    />
                  );
                })}
              </div>
            ))}
            <div ref={scrollAnchorRef} />
          </div>
        )}
      </div>

      <ChatMessageComposer inputId={inputId} labels={labels.composer} onSend={handleSend} />
    </section>
  );
}
