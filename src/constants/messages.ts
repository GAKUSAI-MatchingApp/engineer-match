/**
 * Only remaining live export from what used to be a larger mock-chat-UI
 * constants module: EmptyConversation.tsx (the real, Supabase-backed
 * Engineer/Company message pages' "no conversation selected" state) still
 * needs this. Everything else that used to live here (MESSAGES_PAGE,
 * CONVERSATIONS mock data, MOCK_AUTO_REPLIES, etc.) was only consumed by the
 * dead mock chat component tree (src/components/messages/{MessageThread,
 * ConversationList, ...}.tsx, never imported by any real page) and has been
 * removed along with those files.
 */

export const EMPTY_CONVERSATION_LABELS = {
  message: "会話を選択してください。",
} as const;
