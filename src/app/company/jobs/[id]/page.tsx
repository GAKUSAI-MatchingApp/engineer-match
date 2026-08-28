import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { JobDetailActions } from "@/components/company/JobStatusBadge";
import { COMPANY_NAV } from "@/constants/dashboard";
import {
  CONTRACT_TYPE_BADGE_STYLES,
  CONTRACT_TYPE_LABEL,
  JOB_DETAIL_META,
  JOB_FORM_FIELDS,
  WORK_STYLE_LABEL,
} from "@/constants/company-jobs";
import { createClient } from "@/lib/supabase/server";
import { getCompanyOpportunity, listSkills } from "@/lib/company/jobs";
import { getCompanyHeaderIdentity } from "@/lib/company/profile";
import { formatDateJa } from "@/lib/engineer/format";

interface CompanyJobDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CompanyJobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const detail = user ? await getCompanyOpportunity(supabase, user.id, id) : null;

  return {
    title: detail
      ? `${detail.opportunity.title} | ENGINEER MATCH`
      : "求人詳細 | ENGINEER MATCH",
  };
}

export default async function CompanyJobDetailPage({ params }: CompanyJobDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const detail = authUser ? await getCompanyOpportunity(supabase, authUser.id, id) : null;

  if (!detail) {
    notFound();
  }

  const { opportunity, employment, project, hourly, requiredSkillIds } = detail;
  const [skills, identity] = await Promise.all([
    listSkills(supabase),
    getCompanyHeaderIdentity(supabase, authUser),
  ]);
  const requiredSkillNames = skills.filter((skill) => requiredSkillIds.includes(skill.id));

  return (
    <DashboardShell
      navItems={COMPANY_NAV}
      activeHref="/company/jobs"
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

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <JobDetailActions jobId={opportunity.id} initialStatus={opportunity.status} />

        <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {opportunity.title}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${CONTRACT_TYPE_BADGE_STYLES[opportunity.contract_type as keyof typeof CONTRACT_TYPE_BADGE_STYLES]}`}
          >
            {CONTRACT_TYPE_LABEL[opportunity.contract_type as keyof typeof CONTRACT_TYPE_LABEL]}
          </span>
          <span className="text-xs text-muted-foreground">
            {JOB_DETAIL_META.createdLabel}: {formatDateJa(opportunity.created_at)}
          </span>
          <span className="text-xs text-muted-foreground">
            {JOB_DETAIL_META.updatedLabel}: {formatDateJa(opportunity.updated_at)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <h3 className="text-base font-semibold text-foreground">
              {JOB_DETAIL_META.jobInfoTitle}
            </h3>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {opportunity.description}
            </p>

            <div className="mt-6 border-t border-border pt-6">
              <h4 className="text-sm font-semibold text-foreground">
                {JOB_DETAIL_META.requiredSkillsTitle}
              </h4>
              {requiredSkillNames.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {requiredSkillNames.map((skill) => (
                    <li key={skill.id}>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {skill.name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {JOB_FORM_FIELDS.requiredSkills.emptyMessage}
                </p>
              )}
            </div>

            {opportunity.custom_required_skills_note && (
              <div className="mt-6 border-t border-border pt-6">
                <h4 className="text-sm font-semibold text-foreground">
                  {JOB_DETAIL_META.customRequiredSkillsNoteTitle}
                </h4>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {opportunity.custom_required_skills_note}
                </p>
              </div>
            )}
          </section>

          {employment && (
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <h3 className="text-base font-semibold text-foreground">就職条件</h3>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.workStyle.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {WORK_STYLE_LABEL[employment.work_style] ?? employment.work_style}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">年収</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {employment.salary_min}万円〜{employment.salary_max}万円
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {project && (
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <h3 className="text-base font-semibold text-foreground">案件条件</h3>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.deadline.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {project.deadline}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.budget.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {project.budget}万円
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.headcount.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {project.headcount}名
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.isOnlineProject.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {project.is_online === null
                      ? JOB_FORM_FIELDS.isOnlineUnspecified
                      : project.is_online
                        ? JOB_FORM_FIELDS.isOnlineYes
                        : JOB_FORM_FIELDS.isOnlineNo}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {hourly && (
            <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              <h3 className="text-base font-semibold text-foreground">時間精算条件</h3>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.periodStart.label} 〜 {JOB_FORM_FIELDS.periodEnd.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {hourly.period_start} 〜 {hourly.period_end}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.timeStart.label} 〜 {JOB_FORM_FIELDS.timeEnd.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {hourly.time_start.slice(0, 5)} 〜 {hourly.time_end.slice(0, 5)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.hourlyRate.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {hourly.hourly_rate}円
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.headcount.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {hourly.headcount}名
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.workStyle.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {hourly.work_style
                      ? (WORK_STYLE_LABEL[hourly.work_style] ?? hourly.work_style)
                      : "未設定（登録時期が古い求人・案件です。編集時に選択してください）"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {JOB_FORM_FIELDS.isOnlineProject.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {hourly.is_online
                      ? JOB_FORM_FIELDS.isOnlineYes
                      : JOB_FORM_FIELDS.isOnlineNo}
                  </dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
