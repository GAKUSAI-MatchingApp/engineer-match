import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EngineerConversationList } from "@/components/messages/EngineerConversationList";
import { EmptyConversation } from "@/components/messages/EmptyConversation";
import { ENGINEER_NAV } from "@/constants/dashboard";
import {
  ENGINEER_MESSAGES_PAGE,
  ENGINEER_MESSAGES_SIGN_IN_REQUIRED_LABELS,
} from "@/constants/engineer-messages";
import { createClient } from "@/lib/supabase/server";
import { listMyConversations } from "@/lib/engineer/chat";
import { getEngineerHeaderIdentity } from "@/lib/engineer/profile";

export const metadata: Metadata = {
  title: `${ENGINEER_MESSAGES_PAGE.title} | ENGINEER MATCH`,
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const identity = await getEngineerHeaderIdentity(supabase, authUser);

  return (
    <DashboardShell
      navItems={ENGINEER_NAV}
      activeHref="/messages"
      pageTitle={ENGINEER_MESSAGES_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <p className="text-sm text-muted-foreground">{ENGINEER_MESSAGES_PAGE.description}</p>

      {authUser ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:h-[calc(100dvh-220px)] lg:min-h-[520px] lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
          <div className="min-w-0 lg:h-full lg:min-h-0">
            <EngineerConversationList conversations={await listMyConversations(supabase, authUser.id)} />
          </div>
          <div className="hidden min-w-0 lg:block lg:h-full lg:min-h-0">
            <EmptyConversation />
          </div>
        </div>
      ) : (
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
      )}
    </DashboardShell>
  );
}
