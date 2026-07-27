import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CompanyProfileHeader } from "@/components/company/CompanyProfileHeader";
import { CompanyOverviewCard } from "@/components/company/CompanyOverviewCard";
import { CompanyStatistics } from "@/components/company/CompanyStatistics";
import { COMPANY_NAV } from "@/constants/dashboard";
import { COMPANY_PROFILE_PAGE } from "@/constants/company";
import type { CompanyStatisticsItem } from "@/components/company/CompanyStatistics";
import { createClient } from "@/lib/supabase/server";
import {
  getCompanyProfile,
  getCompanyHeaderIdentity,
  listActiveIndustryCategories,
} from "@/lib/company/profile";
import { getCompanyMetrics } from "@/lib/company/dashboard";

export const metadata: Metadata = {
  title: "企業プロフィール | ENGINEER MATCH",
  description: "企業プロフィールを確認・管理できます。",
};

export default async function CompanyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [profile, identity, metrics, industryCategories] = await Promise.all([
    authUser ? getCompanyProfile(supabase, authUser.id) : Promise.resolve(null),
    getCompanyHeaderIdentity(supabase, authUser),
    authUser
      ? getCompanyMetrics(supabase, authUser.id)
      : Promise.resolve({
          publishedCount: 0,
          draftCount: 0,
          closedCount: 0,
          totalApplicants: 0,
          screeningCount: 0,
          newApplicantsCount: 0,
          acceptedCount: 0,
        }),
    listActiveIndustryCategories(supabase),
  ]);

  const statistics: CompanyStatisticsItem[] = [
    { label: "掲載中の求人・案件", value: String(metrics.publishedCount), icon: "briefcase", helper: "公開中" },
    { label: "累計応募者数", value: String(metrics.totalApplicants), icon: "users", helper: "全期間" },
    { label: "選考中の応募者", value: String(metrics.screeningCount), icon: "clock", helper: "対応待ち" },
    { label: "採用決定数", value: String(metrics.acceptedCount), icon: "userCheck", helper: "全期間" },
  ];

  return (
    <DashboardShell
      navItems={COMPANY_NAV}
      activeHref="/company/profile"
      pageTitle={COMPANY_PROFILE_PAGE.title}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {COMPANY_PROFILE_PAGE.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {COMPANY_PROFILE_PAGE.description}
        </p>
      </div>

      <CompanyProfileHeader profile={profile} industryCategories={industryCategories} />

      <CompanyStatistics items={statistics} />

      <CompanyOverviewCard profile={profile} accountEmail={authUser?.email ?? null} />
    </DashboardShell>
  );
}
