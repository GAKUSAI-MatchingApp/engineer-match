import { ChatMessageThread } from "@/components/messages/ChatMessageThread";
import {
  COMPANY_COMPOSER_LABELS,
  COMPANY_MESSAGE_HEADER_LABELS,
  COMPANY_MESSAGE_THREAD_LABELS,
} from "@/constants/company-messages";
import type { CompanyConversationDetail } from "@/lib/company/chat";

interface CompanyMessageThreadProps {
  conversation: CompanyConversationDetail;
  currentUserId: string;
}

export function CompanyMessageThread({
  conversation,
  currentUserId,
}: CompanyMessageThreadProps) {
  return (
    <ChatMessageThread
      conversation={conversation}
      currentUserId={currentUserId}
      counterpartName={conversation.engineerName}
      listHref="/company/messages"
      opportunityHref={`/company/jobs/${conversation.opportunityId}`}
      applicationHref={`/company/applicants/${conversation.applicationId}`}
      inputId="company-message-composer-input"
      logPrefix="company-chat"
      labels={{
        backLabel: COMPANY_MESSAGE_HEADER_LABELS.backLabel,
        ...COMPANY_MESSAGE_THREAD_LABELS,
        composer: COMPANY_COMPOSER_LABELS,
      }}
    />
  );
}
