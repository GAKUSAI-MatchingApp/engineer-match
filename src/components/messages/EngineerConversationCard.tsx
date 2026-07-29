import { ChatConversationCard } from "@/components/messages/ChatConversationCard";
import { ENGINEER_CONVERSATION_LIST_META } from "@/constants/engineer-messages";
import type { ConversationListItem } from "@/lib/engineer/chat";

interface EngineerConversationCardProps {
  conversation: ConversationListItem;
  isActive: boolean;
}

export function EngineerConversationCard({
  conversation,
  isActive,
}: EngineerConversationCardProps) {
  return (
    <ChatConversationCard
      href={`/messages/${conversation.applicationId}`}
      counterpartName={conversation.companyName}
      opportunityTitle={conversation.opportunityTitle}
      lastMessageBody={conversation.lastMessageBody}
      lastMessageAt={conversation.lastMessageAt}
      unreadCount={conversation.unreadCount}
      unreadSuffix={ENGINEER_CONVERSATION_LIST_META.unreadSuffix}
      isActive={isActive}
    />
  );
}
