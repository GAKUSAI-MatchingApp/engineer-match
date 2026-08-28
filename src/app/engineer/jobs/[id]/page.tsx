import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { JobDetailHero } from "@/components/jobs/JobDetailHero";
import { JobDescription } from "@/components/jobs/JobDescription";
import { RequiredSkills } from "@/components/jobs/RequiredSkills";
import { CustomRequiredSkillsNote } from "@/components/jobs/CustomRequiredSkillsNote";
import { CompanyInfo } from "@/components/jobs/CompanyInfo";
import { ApplySidebar } from "@/components/jobs/ApplySidebar";
import { ENGINEER_NAV } from "@/constants/dashboard";
import { JOB_DETAIL_META, JOB_NOT_FOUND_LABELS, SIGN_IN_REQUIRED_LABELS } from "@/constants/jobs";
import { createClient } from "@/lib/supabase/server";
import { getPublishedOpportunity } from "@/lib/engineer/opportunities";
import { getMyApplicationFor } from "@/lib/engineer/applications";
import { isOpportunityFavorited } from "@/lib/engineer/favorites";
import { getEngineerHeaderIdentity } from "@/lib/engineer/profile";
import { formatSalaryLabelFromDetail, formatDateJa } from "@/lib/engineer/format";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const detail = await getPublishedOpportunity(supabase, id);

  return {
    title: detail ? `${detail.opportunity.title} | ENGINEER MATCH` : "求人詳細 | ENGINEER MATCH",
  };
}

export default async function EngineerJobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [detail, identity] = await Promise.all([
    getPublishedOpportunity(supabase, id),
    getEngineerHeaderIdentity(supabase, authUser),
  ]);

  if (!detail) {
    return (
      <DashboardShell
        navItems={ENGINEER_NAV}
        activeHref="/engineer/jobs"
        pageTitle="求人詳細"
        userName={identity.name}
        userInitials={identity.initials}
        userEmail={identity.email}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">{JOB_NOT_FOUND_LABELS.title}</p>
          <p className="text-sm text-muted-foreground">{JOB_NOT_FOUND_LABELS.description}</p>
          <Link
            href={JOB_DETAIL_META.backHref}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {JOB_NOT_FOUND_LABELS.ctaLabel}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  if (!authUser) {
    return (
      <DashboardShell
        navItems={ENGINEER_NAV}
        activeHref="/engineer/jobs"
        pageTitle="求人詳細"
        userName={identity.name}
        userInitials={identity.initials}
        userEmail={identity.email}
      >
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
      </DashboardShell>
    );
  }

  const [existingApplication, isFavorited] = await Promise.all([
    getMyApplicationFor(supabase, authUser.id, id),
    isOpportunityFavorited(supabase, authUser.id, id),
  ]);

  const salaryLabel = formatSalaryLabelFromDetail({
    contractType: detail.opportunity.contract_type as "employment" | "project" | "hourly",
    employment: detail.employment,
    project: detail.project,
    hourly: detail.hourly,
  });

  return (
    <DashboardShell
      navItems={ENGINEER_NAV}
      activeHref="/engineer/jobs"
      pageTitle="求人詳細"
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

      <JobDetailHero detail={detail} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <JobDescription description={detail.opportunity.description} />
          {detail.requiredSkillNames.length > 0 && (
            <RequiredSkills skills={detail.requiredSkillNames} />
          )}
          {detail.opportunity.custom_required_skills_note && (
            <CustomRequiredSkillsNote note={detail.opportunity.custom_required_skills_note} />
          )}
          {detail.company && <CompanyInfo company={detail.company} />}
        </div>

        <div className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
          <ApplySidebar
            opportunityId={detail.opportunity.id}
            contractType={detail.opportunity.contract_type as "employment" | "project" | "hourly"}
            salaryLabel={salaryLabel}
            updatedLabel={formatDateJa(detail.opportunity.updated_at)}
            isSignedIn
            userId={authUser.id}
            initialHasApplied={existingApplication !== null}
            initialIsFavorited={isFavorited}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
