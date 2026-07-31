import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ApplicantList } from "@/components/company/applicants/ApplicantList";
import { COMPANY_NAV } from "@/constants/dashboard";
import { APPLICANTS_PAGE } from "@/constants/company-applicants";
import { createClient } from "@/lib/supabase/server";
import { listCompanyApplicants } from "@/lib/company/applicants";
import { getCompanyHeaderIdentity } from "@/lib/company/profile";

export const metadata: Metadata = {
  title: "応募者管理 | ENGINEER MATCH",
  description: "求人・案件への応募者を確認・管理できます。",
};

export default async function CompanyApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [applicants, identity] = await Promise.all([
    authUser ? listCompanyApplicants(supabase, authUser.id) : Promise.resolve([]),
    getCompanyHeaderIdentity(supabase, authUser),
  ]);

  return (
    <DashboardShell
      navItems={COMPANY_NAV}
      activeHref="/company/applicants"
      pageTitle={APPLICANTS_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {APPLICANTS_PAGE.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {APPLICANTS_PAGE.description}
        </p>
      </div>

      <ApplicantList applicants={applicants} initialAppliedJob={job} />
    </DashboardShell>
  );
}
