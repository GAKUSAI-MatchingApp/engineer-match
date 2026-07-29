import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CompanyConversationList } from "@/components/messages/CompanyConversationList";
import { EmptyConversation } from "@/components/messages/EmptyConversation";
import { COMPANY_NAV } from "@/constants/dashboard";
import {
  COMPANY_MESSAGES_PAGE,
  COMPANY_MESSAGES_SIGN_IN_REQUIRED_LABELS,
} from "@/constants/company-messages";
import { createClient } from "@/lib/supabase/server";
import { listCompanyConversations } from "@/lib/company/chat";
import { getCompanyHeaderIdentity } from "@/lib/company/profile";

export const metadata: Metadata = {
  title: `${COMPANY_MESSAGES_PAGE.title} | ENGINEER MATCH`,
};

export default async function CompanyMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const identity = await getCompanyHeaderIdentity(supabase, authUser);

  return (
    <DashboardShell
      navItems={COMPANY_NAV}
      activeHref="/company/messages"
      pageTitle={COMPANY_MESSAGES_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <p className="text-sm text-muted-foreground">{COMPANY_MESSAGES_PAGE.description}</p>

      {authUser ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:h-[calc(100dvh-220px)] lg:min-h-[520px] lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
          <div className="min-w-0 lg:h-full lg:min-h-0">
            <CompanyConversationList conversations={await listCompanyConversations(supabase, authUser.id)} />
          </div>
          <div className="hidden min-w-0 lg:block lg:h-full lg:min-h-0">
            <EmptyConversation />
          </div>
        </div>
      ) : (
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
      )}
    </DashboardShell>
  );
}
