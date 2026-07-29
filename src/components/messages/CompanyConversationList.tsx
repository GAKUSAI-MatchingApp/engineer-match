"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CompanyConversationCard } from "@/components/messages/CompanyConversationCard";
import {
  COMPANY_CONVERSATION_LIST_META,
  COMPANY_CONVERSATION_SEARCH_LABELS,
} from "@/constants/company-messages";
import type { CompanyConversationListItem } from "@/lib/company/chat";

interface CompanyConversationListProps {
  conversations: CompanyConversationListItem[];
  activeId?: string;
}

export function CompanyConversationList({
  conversations,
  activeId,
}: CompanyConversationListProps) {
  const [query, setQuery] = useState("");
  const unreadTotal = conversations.reduce(
    (total, conversation) =>
      total +
      (conversation.applicationId === activeId ? 0 : conversation.unreadCount),
    0,
  );

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return conversations;
    return conversations.filter((conversation) =>
      [conversation.engineerName, conversation.opportunityTitle, conversation.lastMessageBody ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(trimmed),
    );
  }, [conversations, query]);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="shrink-0 border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">会話一覧</h2>
          <span className="text-xs text-muted-foreground">
            {conversations.length}件
            {unreadTotal > 0 && `・未読 ${unreadTotal}件`}
          </span>
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={COMPANY_CONVERSATION_SEARCH_LABELS.placeholder}
            className="h-11 rounded-xl pl-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {COMPANY_CONVERSATION_LIST_META.noConversationsTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {COMPANY_CONVERSATION_LIST_META.noConversationsDescription}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {COMPANY_CONVERSATION_LIST_META.noResultsTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {COMPANY_CONVERSATION_LIST_META.noResultsDescription}
            </p>
          </div>
        ) : (
          <ul className="flex min-w-0 flex-col gap-1">
            {filtered.map((conversation) => (
              <li key={conversation.chatRoomId}>
                <CompanyConversationCard
                  conversation={conversation}
                  isActive={conversation.applicationId === activeId}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
