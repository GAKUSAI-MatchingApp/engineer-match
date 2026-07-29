import { ChatConversationCard } from "@/components/messages/ChatConversationCard";
import { COMPANY_CONVERSATION_LIST_META } from "@/constants/company-messages";
import type { CompanyConversationListItem } from "@/lib/company/chat";

interface CompanyConversationCardProps {
  conversation: CompanyConversationListItem;
  isActive: boolean;
}

export function CompanyConversationCard({
  conversation,
  isActive,
}: CompanyConversationCardProps) {
  return (
    <ChatConversationCard
      href={`/company/messages/${conversation.applicationId}`}
      counterpartName={conversation.engineerName}
      opportunityTitle={conversation.opportunityTitle}
      lastMessageBody={conversation.lastMessageBody}
      lastMessageAt={conversation.lastMessageAt}
      unreadCount={conversation.unreadCount}
      unreadSuffix={COMPANY_CONVERSATION_LIST_META.unreadSuffix}
      isActive={isActive}
    />
  );
}
