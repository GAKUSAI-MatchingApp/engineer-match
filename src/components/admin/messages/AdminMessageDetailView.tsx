import { AdminMessageDetailHeader } from "@/components/admin/messages/AdminMessageDetailHeader";
import { AdminMessageTranscriptSection } from "@/components/admin/messages/AdminMessageTranscriptSection";
import type { AdminConversationDetail } from "@/lib/admin/messages";

interface AdminMessageDetailViewProps {
  conversation: AdminConversationDetail;
}

export function AdminMessageDetailView({ conversation }: AdminMessageDetailViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <AdminMessageDetailHeader conversation={conversation} />
      <AdminMessageTranscriptSection conversation={conversation} />
    </div>
  );
}
