import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Briefcase, TriangleAlert, Users } from "lucide-react";
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
import { ENGINEER_NAV } from "@/constants/dashboard";
import { ENGINEER_DETAIL_META } from "@/constants/company-engineers";
import { PROFILE_PREVIEW_META } from "@/constants/engineer-profile";
import { createClient } from "@/lib/supabase/server";
import { getSearchableEngineerDetail } from "@/lib/company/engineers";
import { getEngineerProfile } from "@/lib/engineer/profile";
import { listEngineerReviews, summarizeReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: `${PROFILE_PREVIEW_META.pageTitle} | ENGINEER MATCH`,
  description: "企業から見た自分の公開プロフィールをプレビューできます。",
};

/**
 * RD #21: "公開プロフィールを確認" now renders a real preview instead of a
 * demo-only placeholder. Reuses the exact same display-only components and
 * getSearchableEngineerDetail() query as the company-side engineer detail
 * page (src/app/company/engineers/[id]/page.tsx) -- just called with the
 * viewer's own id instead of a route param -- so there is no second
 * implementation of "how an engineer profile is displayed" to keep in sync.
 *
 * getSearchableEngineerDetail() has no is_public filter of its own; it
 * relies entirely on RLS (035_engineer_search_visibility_policies.sql).
 * Alongside the "is_public = TRUE" policies, engineer_profiles/users/
 * user_skills/user_qualifications also each carry an unconditional
 * "select_own" policy (id = auth.uid()), and Postgres ORs permissive
 * policies together -- so calling this with the signed-in engineer's own id
 * succeeds regardless of their current is_public value. That is what makes
 * self-preview-while-private possible with zero RLS/query changes.
 */
export default async function EngineerProfilePreviewPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [engineer, ownProfile, userRow, reviews] = authUser
    ? await Promise.all([
        getSearchableEngineerDetail(supabase, authUser.id),
        getEngineerProfile(supabase, authUser.id),
        supabase.from("users").select("name").eq("id", authUser.id).maybeSingle(),
        listEngineerReviews(supabase, authUser.id),
      ])
    : [null, null, { data: null }, []];

  const name = (userRow?.data?.name as string | undefined) ?? "";
  const email = authUser?.email ?? "";
  const isPublic = ownProfile?.is_public ?? true;
  const reviewSummary = summarizeReviews(reviews);

  return (
    <DashboardShell
      navItems={ENGINEER_NAV}
      activeHref="/engineer/profile"
      pageTitle={PROFILE_PREVIEW_META.pageTitle}
      userName={name || "エンジニア"}
      userInitials={name ? name.charAt(0) : "?"}
      userEmail={email}
    >
      <div>
        <Link
          href={PROFILE_PREVIEW_META.backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {PROFILE_PREVIEW_META.backLabel}
        </Link>
      </div>

      {!isPublic && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{PROFILE_PREVIEW_META.privateNotice}</p>
        </div>
      )}

      {!engineer ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">
          {PROFILE_PREVIEW_META.notFoundMessage}
        </p>
      ) : (
        <>
          <EngineerProfileHero engineer={engineer} />

          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
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
        </>
      )}
    </DashboardShell>
  );
}
