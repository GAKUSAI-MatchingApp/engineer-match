import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CreateJobForm } from "@/components/company/CreateJobForm";
import { COMPANY_NAV } from "@/constants/dashboard";
import { CREATE_JOB_META, JOB_DETAIL_META } from "@/constants/company-jobs";
import { createClient } from "@/lib/supabase/server";
import { listSkills } from "@/lib/company/jobs";
import { getCompanyHeaderIdentity } from "@/lib/company/profile";

export const metadata: Metadata = {
  title: "求人・案件を新規作成 | ENGINEER MATCH",
  description: "新しい求人・案件を作成できます。",
};

export default async function CompanyNewJobPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const [skills, identity] = await Promise.all([
    listSkills(supabase),
    getCompanyHeaderIdentity(supabase, authUser),
  ]);

  return (
    <DashboardShell
      navItems={COMPANY_NAV}
      activeHref="/company/jobs/new"
      pageTitle="新規掲載"
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <div>
        <Link
          href={JOB_DETAIL_META.backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {JOB_DETAIL_META.backLabel}
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {CREATE_JOB_META.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {CREATE_JOB_META.description}
        </p>
      </div>

      <CreateJobForm skills={skills} />
    </DashboardShell>
  );
}
