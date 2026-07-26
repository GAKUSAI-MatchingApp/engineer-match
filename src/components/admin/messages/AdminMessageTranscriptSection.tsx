import { AdminDetailField, AdminDetailGrid, AdminDetailSection } from "@/components/admin/shared/AdminDetailSection";
import { ADMIN_MESSAGE_DETAIL_SECTIONS } from "@/constants/admin-messages";
import type { AdminConversationDetail } from "@/lib/admin/messages";
import { cn } from "@/lib/utils";

interface AdminMessageTranscriptSectionProps {
  conversation: AdminConversationDetail;
}

export function AdminMessageTranscriptSection({ conversation }: AdminMessageTranscriptSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <AdminDetailSection title={ADMIN_MESSAGE_DETAIL_SECTIONS.participants}>
        <AdminDetailGrid>
          <AdminDetailField label="エンジニア" value={conversation.engineerName} />
          <AdminDetailField label="企業" value={conversation.companyName} />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_MESSAGE_DETAIL_SECTIONS.relatedOpportunity}>
        <p className="text-sm text-foreground">{conversation.opportunityTitle}</p>
      </AdminDetailSection>

      <AdminDetailSection title={ADMIN_MESSAGE_DETAIL_SECTIONS.transcript}>
        {conversation.messages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex flex-col gap-1", message.isEngineer ? "items-start" : "items-end")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    message.isEngineer ? "bg-muted text-foreground" : "bg-primary/10 text-foreground",
                  )}
                >
                  {message.body}
                </div>
                <p className="px-1 text-[11px] text-muted-foreground">
                  {message.senderName} ・ {message.sentAtLabel}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">メッセージはまだありません。</p>
        )}
      </AdminDetailSection>
    </div>
  );
}
