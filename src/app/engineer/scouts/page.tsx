import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EngineerScoutList } from "@/components/engineer/scouts/EngineerScoutList";
import { ENGINEER_NAV } from "@/constants/dashboard";
import {
  ENGINEER_SCOUTS_PAGE,
  ENGINEER_SCOUTS_SIGN_IN_REQUIRED_LABELS,
} from "@/constants/engineer-scouts";
import { createClient } from "@/lib/supabase/server";
import { listMyScouts } from "@/lib/engineer/scouts";
import { getEngineerHeaderIdentity } from "@/lib/engineer/profile";

export const metadata: Metadata = {
  title: `${ENGINEER_SCOUTS_PAGE.title} | ENGINEER MATCH`,
};

export default async function EngineerScoutsPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const identity = await getEngineerHeaderIdentity(supabase, authUser);

  return (
    <DashboardShell
      navItems={ENGINEER_NAV}
      activeHref="/engineer/scouts"
      pageTitle={ENGINEER_SCOUTS_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <p className="text-sm text-muted-foreground">{ENGINEER_SCOUTS_PAGE.description}</p>

      {authUser ? (
        <EngineerScoutList initialScouts={await listMyScouts(supabase, authUser.id)} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {ENGINEER_SCOUTS_SIGN_IN_REQUIRED_LABELS.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {ENGINEER_SCOUTS_SIGN_IN_REQUIRED_LABELS.description}
          </p>
          <Link
            href={ENGINEER_SCOUTS_SIGN_IN_REQUIRED_LABELS.ctaHref}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {ENGINEER_SCOUTS_SIGN_IN_REQUIRED_LABELS.ctaLabel}
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
