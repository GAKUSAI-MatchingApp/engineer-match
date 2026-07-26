import Link from "next/link";
import { AdminDataTable } from "@/components/admin/shared/AdminDataTable";
import { ADMIN_MESSAGE_ACTION_LABELS, ADMIN_MESSAGE_TABLE_COLUMNS } from "@/constants/admin-messages";
import type { AdminConversationListItem } from "@/lib/admin/messages";

interface AdminMessageTableProps {
  conversations: AdminConversationListItem[];
}

export function AdminMessageTable({ conversations }: AdminMessageTableProps) {
  const columns = [...ADMIN_MESSAGE_TABLE_COLUMNS, "操作"];
  return (
    <AdminDataTable columns={columns} caption={columns.join("、")}>
      {conversations.map((conversation) => (
        <tr key={conversation.id} className="align-top">
          <td className="px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{conversation.engineerName}</p>
              <p className="truncate text-xs text-muted-foreground">{conversation.companyName}</p>
            </div>
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {conversation.opportunityTitle}
          </td>
          <td className="px-4 py-3">
            <span className="line-clamp-2 max-w-xs text-sm text-foreground">
              {conversation.lastMessageBody ?? "（メッセージなし）"}
            </span>
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
            {conversation.lastMessageAtLabel}
          </td>
          <td className="px-4 py-3 text-sm whitespace-nowrap text-foreground">
            {conversation.messageCount}件
          </td>
          <td className="px-4 py-3">
            <Link
              href={`/admin/messages/${conversation.id}`}
              className="rounded text-xs font-semibold text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {ADMIN_MESSAGE_ACTION_LABELS.viewDetails}
            </Link>
          </td>
        </tr>
      ))}
    </AdminDataTable>
  );
}
