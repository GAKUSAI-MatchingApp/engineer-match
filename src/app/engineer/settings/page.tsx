import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EngineerPrivacySettings } from "@/components/engineer/settings/EngineerPrivacySettings";
import { EngineerLineSettings } from "@/components/engineer/settings/EngineerLineSettings";
import { EngineerEmailSettings } from "@/components/engineer/settings/EngineerEmailSettings";
import { EngineerSecuritySettings } from "@/components/engineer/settings/EngineerSecuritySettings";
import { EngineerDangerZone } from "@/components/engineer/settings/EngineerDangerZone";
import { ENGINEER_NAV } from "@/constants/dashboard";
import { ENGINEER_EMAIL_SETTINGS, ENGINEER_SETTINGS_PAGE } from "@/constants/engineer-settings";
import { SIGN_IN_REQUIRED_LABELS } from "@/constants/applications";
import { createClient } from "@/lib/supabase/server";
import { getEngineerHeaderIdentity, getEngineerProfile } from "@/lib/engineer/profile";
import { getEngineerLineLink } from "@/lib/engineer/line-link";
import { isPasswordAuthUser } from "@/lib/auth/email-change";

export const metadata: Metadata = {
  title: `${ENGINEER_SETTINGS_PAGE.title} | ENGINEER MATCH`,
  description: ENGINEER_SETTINGS_PAGE.description,
};

export default async function EngineerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    lineLinked?: string;
    lineError?: string;
    active?: string;
    emailChanged?: string;
    emailChangeError?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const lineCallback = await searchParams;

  const emailNotice = lineCallback.emailChanged
    ? { status: "success" as const, message: ENGINEER_EMAIL_SETTINGS.confirmedMessage }
    : lineCallback.emailChangeError
      ? { status: "error" as const, message: ENGINEER_EMAIL_SETTINGS.confirmationErrorMessage }
      : null;

  const [profile, identity, lineLink] = await Promise.all([
    authUser ? getEngineerProfile(supabase, authUser.id) : Promise.resolve(null),
    getEngineerHeaderIdentity(supabase, authUser),
    authUser ? getEngineerLineLink(supabase, authUser.id) : Promise.resolve(null),
  ]);

  return (
    <DashboardShell
      navItems={ENGINEER_NAV}
      activeHref="/engineer/settings"
      pageTitle={ENGINEER_SETTINGS_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {ENGINEER_SETTINGS_PAGE.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ENGINEER_SETTINGS_PAGE.description}
        </p>
      </div>

      {authUser ? (
        <>
          <EngineerPrivacySettings initialIsPublic={profile?.is_public ?? false} />
          <EngineerLineSettings
            initialLink={lineLink}
            lineLinked={lineCallback.lineLinked}
            lineError={lineCallback.lineError}
            lineActive={lineCallback.active}
          />
          <EngineerEmailSettings
            email={identity.email}
            isPasswordUser={isPasswordAuthUser(authUser)}
            initialNotice={emailNotice}
          />
          <EngineerSecuritySettings />
          <EngineerDangerZone />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">{SIGN_IN_REQUIRED_LABELS.title}</p>
          <p className="text-sm text-muted-foreground">{SIGN_IN_REQUIRED_LABELS.description}</p>
          <Link
            href={SIGN_IN_REQUIRED_LABELS.ctaHref}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {SIGN_IN_REQUIRED_LABELS.ctaLabel}
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
