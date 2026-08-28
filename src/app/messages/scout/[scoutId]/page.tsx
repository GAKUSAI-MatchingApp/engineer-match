import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ScoutChatThread } from "@/components/messages/ScoutChatThread";
import { ENGINEER_NAV } from "@/constants/dashboard";
import { ENGINEER_SCOUT_CHAT_META } from "@/constants/engineer-scouts";
import {
  ENGINEER_COMPOSER_LABELS,
  ENGINEER_MESSAGE_THREAD_LABELS,
  ENGINEER_MESSAGES_SIGN_IN_REQUIRED_LABELS,
} from "@/constants/engineer-messages";
import { createClient } from "@/lib/supabase/server";
import { getScoutConversationForEngineer } from "@/lib/engineer/scouts";
import { getEngineerHeaderIdentity } from "@/lib/engineer/profile";

interface ScoutChatPageProps {
  params: Promise<{ scoutId: string }>;
}

export const metadata: Metadata = {
  title: `スカウトチャット | ENGINEER MATCH`,
};

export default async function EngineerScoutChatPage({ params }: ScoutChatPageProps) {
  const { scoutId } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const identity = await getEngineerHeaderIdentity(supabase, authUser);

  if (!authUser) {
    return (
      <DashboardShell
        navItems={ENGINEER_NAV}
        activeHref="/engineer/scouts"
        pageTitle={ENGINEER_SCOUT_CHAT_META.notFoundTitle}
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

  const conversation = await getScoutConversationForEngineer(supabase, authUser.id, scoutId);

  if (!conversation) {
    return (
      <DashboardShell
        navItems={ENGINEER_NAV}
        activeHref="/engineer/scouts"
        pageTitle={ENGINEER_SCOUT_CHAT_META.notFoundTitle}
        userName={identity.name}
        userInitials={identity.initials}
        userEmail={identity.email}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">{ENGINEER_SCOUT_CHAT_META.notFoundTitle}</p>
          <p className="text-sm text-muted-foreground">{ENGINEER_SCOUT_CHAT_META.notFoundDescription}</p>
          <Link
            href={ENGINEER_SCOUT_CHAT_META.backHref}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {ENGINEER_SCOUT_CHAT_META.backLabel}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      navItems={ENGINEER_NAV}
      activeHref="/engineer/scouts"
      pageTitle={conversation.companyName}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <div className="h-[calc(100dvh-152px)] min-h-[480px] min-w-0">
        <ScoutChatThread
          key={conversation.chatRoomId}
          conversation={conversation}
          currentUserId={authUser.id}
          counterpartName={conversation.companyName}
          backHref={ENGINEER_SCOUT_CHAT_META.backHref}
          inputId="engineer-scout-composer-input"
          logPrefix="engineer-scout-chat"
          labels={{
            backLabel: ENGINEER_SCOUT_CHAT_META.backLabel,
            ...ENGINEER_MESSAGE_THREAD_LABELS,
            composer: ENGINEER_COMPOSER_LABELS,
          }}
        />
      </div>
    </DashboardShell>
  );
}
