import { MessagesSquare } from "lucide-react";
import type { AdminConversationDetail } from "@/lib/admin/messages";

interface AdminMessageDetailHeaderProps {
  conversation: AdminConversationDetail;
}

export function AdminMessageDetailHeader({ conversation }: AdminMessageDetailHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10"
          aria-hidden="true"
        >
          <MessagesSquare className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground">{conversation.engineerName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{conversation.companyName}</p>
          <p className="text-sm text-muted-foreground">{conversation.opportunityTitle}</p>
        </div>
      </div>
    </div>
  );
}
