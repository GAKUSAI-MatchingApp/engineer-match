import { formatTimeJa } from "@/lib/engineer/format";

interface ChatMessageBubbleProps {
  body: string;
  sentAt: string;
  isOwnMessage: boolean;
  senderLabel: string;
  isGroupedWithPrevious: boolean;
}

export function ChatMessageBubble({
  body,
  sentAt,
  isOwnMessage,
  senderLabel,
  isGroupedWithPrevious,
}: ChatMessageBubbleProps) {
  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} ${
        isGroupedWithPrevious ? "mt-1" : "mt-3"
      }`}
    >
      <div className="flex min-w-0 max-w-[88%] flex-col gap-1 sm:max-w-[72%]">
        {!isGroupedWithPrevious && (
          <span
            className={`px-1 text-[11px] font-medium text-muted-foreground ${
              isOwnMessage ? "text-right" : ""
            }`}
          >
            {senderLabel}
          </span>
        )}
        <div
          className={`min-w-0 rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${
            isOwnMessage
              ? "rounded-tr-sm bg-primary text-white"
              : "rounded-tl-sm border border-border bg-surface text-foreground"
          }`}
        >
          <p className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">{body}</p>
        </div>
        <time
          dateTime={sentAt}
          className={`px-1 text-[11px] text-muted-foreground ${
            isOwnMessage ? "text-right" : ""
          }`}
        >
          {formatTimeJa(sentAt)}
        </time>
      </div>
    </div>
  );
}
