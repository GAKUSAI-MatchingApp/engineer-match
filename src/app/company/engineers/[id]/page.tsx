import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, MessageSquareOff, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EngineerProfileHero } from "@/components/company/engineers/EngineerProfileHero";
import { EngineerProfileOverview } from "@/components/company/engineers/EngineerProfileOverview";
import { ApplicantSkills } from "@/components/company/applicants/ApplicantSkills";
import { ApplicantQualifications } from "@/components/company/applicants/ApplicantQualifications";
import { ApplicantAssessmentSummary } from "@/components/company/applicants/ApplicantAssessmentSummary";
import { WorkExperienceSection } from "@/components/company/profile-sections/WorkExperienceSection";
import { EducationSection } from "@/components/company/profile-sections/EducationSection";
import { PortfolioSection } from "@/components/company/profile-sections/PortfolioSection";
import { LanguagesSection } from "@/components/company/profile-sections/LanguagesSection";
import { PreferredConditionsSection } from "@/components/company/profile-sections/PreferredConditionsSection";
import { EngineerReviewsSummary } from "@/components/company/engineers/EngineerReviewsSummary";
import { COMPANY_NAV } from "@/constants/dashboard";
import { ENGINEER_DETAIL_META } from "@/constants/company-engineers";
import { createClient } from "@/lib/supabase/server";
import { getSearchableEngineerDetail } from "@/lib/company/engineers";
import { getCompanyHeaderIdentity } from "@/lib/company/profile";
import { listEngineerReviews, summarizeReviews } from "@/lib/reviews";

interface EngineerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EngineerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const engineer = await getSearchableEngineerDetail(supabase, id);

  return {
    title: engineer ? `${engineer.name} | ENGINEER MATCH` : "エンジニア詳細 | ENGINEER MATCH",
  };
}

export default async function CompanyEngineerDetailPage({
  params,
}: EngineerDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const [engineer, identity, reviews] = await Promise.all([
    getSearchableEngineerDetail(supabase, id),
    getCompanyHeaderIdentity(supabase, authUser),
    listEngineerReviews(supabase, id),
  ]);

  if (!engineer) {
    notFound();
  }

  const reviewSummary = summarizeReviews(reviews);

  return (
    <DashboardShell
      navItems={COMPANY_NAV}
      activeHref="/company/engineers"
      pageTitle="エンジニア詳細"
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <div>
        <Link
          href={ENGINEER_DETAIL_META.backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {ENGINEER_DETAIL_META.backLabel}
        </Link>
      </div>

      <EngineerProfileHero engineer={engineer} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <EngineerProfileOverview engineer={engineer} />
          <ApplicantSkills skills={engineer.technicalSkills} />
          <ApplicantQualifications qualifications={engineer.qualifications} />
          <ApplicantAssessmentSummary
            title={ENGINEER_DETAIL_META.humanSkillTitle}
            icon={Users}
            items={engineer.humanAssessments}
          />
          <ApplicantAssessmentSummary
            title={ENGINEER_DETAIL_META.businessSkillTitle}
            icon={Briefcase}
            items={engineer.businessAssessments}
          />
          <WorkExperienceSection workExperiences={engineer.workExperiences} />
          <EducationSection educations={engineer.educations} />
          <PortfolioSection portfolioProjects={engineer.portfolioProjects} />
          <LanguagesSection languages={engineer.languages} />
          <EngineerReviewsSummary reviews={reviews} averageRating={reviewSummary.average ?? 0} />
          <PreferredConditionsSection
            preferredContractTypes={engineer.preferredContractTypes}
            preferredLocations={engineer.preferredLocations}
            workStyle={engineer.workStyle}
            availableFrom={engineer.availableFrom}
            desiredHourlyRate={engineer.desiredHourlyRateMax}
            minimumHourlyRate={engineer.desiredHourlyRateMin}
            desiredAnnualIncome={engineer.desiredAnnualIncome}
          />
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <button
              type="button"
              disabled
              className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-border bg-muted text-sm font-semibold text-muted-foreground"
            >
              <MessageSquareOff className="h-4 w-4" aria-hidden="true" />
              メッセージを送る
            </button>
            <p className="mt-3 text-xs text-muted-foreground">{ENGINEER_DETAIL_META.contactNote}</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
