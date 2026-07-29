import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { formatRelativeDaysJa } from "@/lib/engineer/format";

interface ChatConversationCardProps {
  href: string;
  counterpartName: string;
  opportunityTitle: string;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  unreadSuffix: string;
  isActive: boolean;
}

function initialsFor(name: string): string {
  return name.trim().slice(0, 2) || "?";
}

export function ChatConversationCard({
  href,
  counterpartName,
  opportunityTitle,
  lastMessageBody,
  lastMessageAt,
  unreadCount,
  unreadSuffix,
  isActive,
}: ChatConversationCardProps) {
  const hasUnread = !isActive && unreadCount > 0;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-w-0 items-start gap-3 rounded-xl border px-3 py-3 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
        isActive
          ? "border-primary/30 bg-primary/5 shadow-sm"
          : "border-transparent hover:border-border hover:bg-muted/50"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
          isActive || hasUnread
            ? "bg-primary text-white"
            : "bg-primary/10 text-primary group-hover:bg-primary/15"
        }`}
        aria-hidden="true"
      >
        {initialsFor(counterpartName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">
            {counterpartName || "名前未登録"}
          </p>
          {lastMessageAt && (
            <time
              dateTime={lastMessageAt}
              className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground"
            >
              {formatRelativeDaysJa(lastMessageAt)}
            </time>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-4 font-medium text-foreground/75">
          {opportunityTitle}
        </p>
        <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
          <p
            className={`line-clamp-2 min-w-0 text-xs leading-4 ${
              hasUnread ? "font-semibold text-foreground" : "text-muted-foreground"
            }`}
          >
            {lastMessageBody || (
              <span className="inline-flex items-center gap-1">
                <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
                メッセージを開始できます
              </span>
            )}
          </p>
          {hasUnread && (
            <span
              className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-sm"
              aria-label={`${unreadCount}${unreadSuffix}`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
