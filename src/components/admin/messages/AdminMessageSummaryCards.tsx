import { memo } from "react";
import { MessagesSquare, Sparkles } from "lucide-react";
import { AdminSummaryCard } from "@/components/admin/shared/AdminSummaryCard";
import { ADMIN_MESSAGE_SUMMARY_LABELS } from "@/constants/admin-messages";
import type { AdminConversationListItem } from "@/lib/admin/messages";

interface AdminMessageSummaryCardsProps {
  conversations: AdminConversationListItem[];
}

export const AdminMessageSummaryCards = memo(function AdminMessageSummaryCards({
  conversations,
}: AdminMessageSummaryCardsProps) {
  const total = conversations.length;
  const today = new Date().toDateString();
  const updatedToday = conversations.filter((c) => new Date(c.updatedAtISO).toDateString() === today).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AdminSummaryCard label={ADMIN_MESSAGE_SUMMARY_LABELS.total} value={`${total}件`} icon={MessagesSquare} />
      <AdminSummaryCard
        label={ADMIN_MESSAGE_SUMMARY_LABELS.updatedToday}
        value={`${updatedToday}件`}
        icon={Sparkles}
        tone="positive"
      />
    </div>
  );
});
