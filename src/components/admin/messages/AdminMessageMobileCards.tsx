import Link from "next/link";
import { AdminMobileCardList } from "@/components/admin/shared/AdminMobileCardList";
import { ADMIN_MESSAGE_ACTION_LABELS } from "@/constants/admin-messages";
import type { AdminConversationListItem } from "@/lib/admin/messages";

interface AdminMessageMobileCardsProps {
  conversations: AdminConversationListItem[];
}

export function AdminMessageMobileCards({ conversations }: AdminMessageMobileCardsProps) {
  return (
    <AdminMobileCardList>
      {conversations.map((conversation) => (
        <div key={conversation.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{conversation.engineerName}</p>
            <p className="truncate text-xs text-muted-foreground">{conversation.companyName}</p>
          </div>

          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
            {conversation.lastMessageBody ?? "（メッセージなし）"}
          </p>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{conversation.lastMessageAtLabel}</span>
            <span>{conversation.messageCount}件</span>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <Link
              href={`/admin/messages/${conversation.id}`}
              className="rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_MESSAGE_ACTION_LABELS.viewDetails}
            </Link>
          </div>
        </div>
      ))}
    </AdminMobileCardList>
  );
}
