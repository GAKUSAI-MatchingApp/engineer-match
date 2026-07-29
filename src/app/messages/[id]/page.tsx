import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EngineerConversationList } from "@/components/messages/EngineerConversationList";
import { EngineerMessageThread } from "@/components/messages/EngineerMessageThread";
import { ENGINEER_NAV } from "@/constants/dashboard";
import {
  ENGINEER_CONVERSATION_NOT_FOUND_LABELS,
  ENGINEER_MESSAGES_PAGE,
  ENGINEER_MESSAGES_SIGN_IN_REQUIRED_LABELS,
} from "@/constants/engineer-messages";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateConversationForApplication, listMyConversations } from "@/lib/engineer/chat";
import { getEngineerHeaderIdentity } from "@/lib/engineer/profile";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: `${ENGINEER_MESSAGES_PAGE.title} | ENGINEER MATCH`,
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const identity = await getEngineerHeaderIdentity(supabase, authUser);

  if (!authUser) {
    return (
      <DashboardShell
        navItems={ENGINEER_NAV}
        activeHref="/messages"
        pageTitle={ENGINEER_MESSAGES_PAGE.title}
        userName={identity.name}
        userInitials={identity.initials}
        userEmail={identity.email}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {ENGINEER_MESSAGES_SIGN_IN_REQUIRED_LABELS.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {ENGINEER_MESSAGES_SIGN_IN_REQUIRED_LABELS.description}
          </p>
          <Link
            href={ENGINEER_MESSAGES_SIGN_IN_REQUIRED_LABELS.ctaHref}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {ENGINEER_MESSAGES_SIGN_IN_REQUIRED_LABELS.ctaLabel}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  // Sequential, not Promise.all: getOrCreateConversationForApplication may
  // insert a new chat_rooms row (lazy create on first message), and
  // listMyConversations must see that row rather than racing ahead of it.
  const conversation = await getOrCreateConversationForApplication(supabase, authUser.id, id);
  const conversations = await listMyConversations(supabase, authUser.id);

  if (!conversation) {
    return (
      <DashboardShell
        navItems={ENGINEER_NAV}
        activeHref="/messages"
        pageTitle={ENGINEER_MESSAGES_PAGE.title}
        userName={identity.name}
        userInitials={identity.initials}
        userEmail={identity.email}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {ENGINEER_CONVERSATION_NOT_FOUND_LABELS.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {ENGINEER_CONVERSATION_NOT_FOUND_LABELS.description}
          </p>
          <Link
            href={ENGINEER_CONVERSATION_NOT_FOUND_LABELS.ctaHref}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {ENGINEER_CONVERSATION_NOT_FOUND_LABELS.ctaLabel}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      navItems={ENGINEER_NAV}
      activeHref="/messages"
      pageTitle={conversation.companyName}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <p className="hidden text-sm text-muted-foreground lg:block">
        {ENGINEER_MESSAGES_PAGE.description}
      </p>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:h-[calc(100dvh-220px)] lg:min-h-[520px] lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <div className="hidden min-w-0 lg:block lg:h-full lg:min-h-0">
          <EngineerConversationList conversations={conversations} activeId={id} />
        </div>
        <div className="h-[calc(100dvh-152px)] min-h-[480px] min-w-0 lg:h-full lg:min-h-0">
          <EngineerMessageThread
            key={conversation.chatRoomId}
            conversation={conversation}
            currentUserId={authUser.id}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
