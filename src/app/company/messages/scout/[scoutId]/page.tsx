import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ScoutChatThread } from "@/components/messages/ScoutChatThread";
import { COMPANY_NAV } from "@/constants/dashboard";
import { COMPANY_SCOUT_CHAT_META } from "@/constants/company-scouts";
import {
  COMPANY_COMPOSER_LABELS,
  COMPANY_MESSAGE_THREAD_LABELS,
  COMPANY_MESSAGES_SIGN_IN_REQUIRED_LABELS,
} from "@/constants/company-messages";
import { createClient } from "@/lib/supabase/server";
import { getScoutConversationForCompany } from "@/lib/company/scouts";
import { getCompanyHeaderIdentity } from "@/lib/company/profile";

interface ScoutChatPageProps {
  params: Promise<{ scoutId: string }>;
}

export const metadata: Metadata = {
  title: `スカウトチャット | ENGINEER MATCH`,
};

export default async function CompanyScoutChatPage({ params }: ScoutChatPageProps) {
  const { scoutId } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const identity = await getCompanyHeaderIdentity(supabase, authUser);

  if (!authUser) {
    return (
      <DashboardShell
        navItems={COMPANY_NAV}
        activeHref="/company/engineers"
        pageTitle={COMPANY_SCOUT_CHAT_META.notFoundTitle}
        userName={identity.name}
        userInitials={identity.initials}
        userEmail={identity.email}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {COMPANY_MESSAGES_SIGN_IN_REQUIRED_LABELS.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {COMPANY_MESSAGES_SIGN_IN_REQUIRED_LABELS.description}
          </p>
          <Link
            href={COMPANY_MESSAGES_SIGN_IN_REQUIRED_LABELS.ctaHref}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {COMPANY_MESSAGES_SIGN_IN_REQUIRED_LABELS.ctaLabel}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const conversation = await getScoutConversationForCompany(supabase, authUser.id, scoutId);

  if (!conversation) {
    return (
      <DashboardShell
        navItems={COMPANY_NAV}
        activeHref="/company/engineers"
        pageTitle={COMPANY_SCOUT_CHAT_META.notFoundTitle}
        userName={identity.name}
        userInitials={identity.initials}
        userEmail={identity.email}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">{COMPANY_SCOUT_CHAT_META.notFoundTitle}</p>
          <p className="text-sm text-muted-foreground">{COMPANY_SCOUT_CHAT_META.notFoundDescription}</p>
          <Link
            href={COMPANY_SCOUT_CHAT_META.backHref}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {COMPANY_SCOUT_CHAT_META.backLabel}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      navItems={COMPANY_NAV}
      activeHref="/company/engineers"
      pageTitle={conversation.engineerName}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <div className="h-[calc(100dvh-152px)] min-h-[480px] min-w-0">
        <ScoutChatThread
          key={conversation.chatRoomId}
          conversation={conversation}
          currentUserId={authUser.id}
          counterpartName={conversation.engineerName}
          backHref={COMPANY_SCOUT_CHAT_META.backHref}
          inputId="company-scout-composer-input"
          logPrefix="company-scout-chat"
          labels={{
            backLabel: COMPANY_SCOUT_CHAT_META.backLabel,
            ...COMPANY_MESSAGE_THREAD_LABELS,
            composer: COMPANY_COMPOSER_LABELS,
          }}
        />
      </div>
    </DashboardShell>
  );
}
