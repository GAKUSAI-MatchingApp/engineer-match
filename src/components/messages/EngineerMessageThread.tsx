import { ChatMessageThread } from "@/components/messages/ChatMessageThread";
import {
  ENGINEER_COMPOSER_LABELS,
  ENGINEER_MESSAGE_HEADER_LABELS,
  ENGINEER_MESSAGE_THREAD_LABELS,
} from "@/constants/engineer-messages";
import type { ConversationDetail } from "@/lib/engineer/chat";

interface EngineerMessageThreadProps {
  conversation: ConversationDetail;
  currentUserId: string;
}

export function EngineerMessageThread({
  conversation,
  currentUserId,
}: EngineerMessageThreadProps) {
  return (
    <ChatMessageThread
      conversation={conversation}
      currentUserId={currentUserId}
      counterpartName={conversation.companyName}
      listHref="/messages"
      opportunityHref={`/engineer/jobs/${conversation.opportunityId}`}
      applicationHref={`/engineer/applications/${conversation.applicationId}`}
      inputId="engineer-message-composer-input"
      logPrefix="engineer-chat"
      labels={{
        backLabel: ENGINEER_MESSAGE_HEADER_LABELS.backLabel,
        ...ENGINEER_MESSAGE_THREAD_LABELS,
        composer: ENGINEER_COMPOSER_LABELS,
      }}
    />
  );
}
