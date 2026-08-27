import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  BrainCircuit,
  Code2,
  FolderGit2,
  GraduationCap,
  Languages as LanguagesIcon,
  MapPin,
  User,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProfileSection } from "@/components/engineer/profile/ProfileSection";
import { BasicProfileForm } from "@/components/engineer/profile/BasicProfileForm";
import { PersonalInfoForm } from "@/components/engineer/profile/PersonalInfoForm";
import { TechnicalSkillsManager } from "@/components/engineer/profile/TechnicalSkillsManager";
import { QualificationsManager } from "@/components/engineer/profile/QualificationsManager";
import { WorkExperienceManager } from "@/components/engineer/profile/WorkExperienceManager";
import { EducationManager } from "@/components/engineer/profile/EducationManager";
import { LanguagesManager } from "@/components/engineer/profile/LanguagesManager";
import { PortfolioManager } from "@/components/engineer/profile/PortfolioManager";
import { PreferredConditionsManager } from "@/components/engineer/profile/PreferredConditionsManager";
import { ENGINEER_NAV } from "@/constants/dashboard";
import {
  BUSINESS_SKILL_EDIT_NOTE,
  HUMAN_SKILL_EDIT_NOTE,
  PROFILE_EDIT_META,
  PROFILE_EDIT_SAVE_NOTICES,
  PROFILE_EDIT_SECTIONS,
  SKILLS_SECTION,
} from "@/constants/engineer-profile";
import { createClient } from "@/lib/supabase/server";
import { getEngineerProfile } from "@/lib/engineer/profile";
import { getContactDetails, getPersonalInfo } from "@/lib/engineer/personal-info";
import { listSkillCatalog, listUserSkills } from "@/lib/engineer/skills";
import { listQualificationCatalog, listUserQualifications } from "@/lib/engineer/qualifications";
import {
  listPreferredContractTypes,
  listPreferredLocations,
} from "@/lib/engineer/preferred-conditions";
import { listWorkExperiences } from "@/lib/engineer/work-experience";
import { listEducations } from "@/lib/engineer/education";
import { listLanguages } from "@/lib/engineer/languages";
import { listPortfolioProjects } from "@/lib/engineer/portfolio";

export const metadata: Metadata = {
  title: "プロフィール編集 | ENGINEER MATCH",
  description: "エンジニアのプロフィール編集ページです。",
};

export default async function EngineerProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [
    profile,
    userRow,
    personalInfo,
    contactDetails,
    userSkills,
    skillCatalog,
    userQualifications,
    qualificationCatalog,
    preferredContractTypes,
    preferredLocations,
    workExperiences,
    educations,
    languages,
    portfolioProjects,
  ] = authUser
    ? await Promise.all([
        getEngineerProfile(supabase, authUser.id),
        supabase.from("users").select("name").eq("id", authUser.id).maybeSingle(),
        getPersonalInfo(supabase, authUser.id),
        getContactDetails(supabase, authUser.id),
        listUserSkills(supabase, authUser.id),
        listSkillCatalog(supabase),
        listUserQualifications(supabase, authUser.id),
        listQualificationCatalog(supabase),
        listPreferredContractTypes(supabase, authUser.id),
        listPreferredLocations(supabase, authUser.id),
        listWorkExperiences(supabase, authUser.id),
        listEducations(supabase, authUser.id),
        listLanguages(supabase, authUser.id),
        listPortfolioProjects(supabase, authUser.id),
      ])
    : [null, { data: null }, null, null, [], [], [], [], [], [], [], [], [], []];

  const name = (userRow?.data?.name as string | undefined) ?? "";
  const email = authUser?.email ?? "";

  return (
    <DashboardShell
      navItems={ENGINEER_NAV}
      activeHref="/engineer/profile"
      pageTitle={PROFILE_EDIT_META.pageTitle}
      userName={name || "エンジニア"}
      userInitials={name ? name.charAt(0) : "?"}
      userEmail={email}
    >
      <div>
        <Link
          href={PROFILE_EDIT_META.cancelHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {PROFILE_EDIT_META.backLabel}
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <ProfileSection
          title={PROFILE_EDIT_SECTIONS.basicInfo}
          description={PROFILE_EDIT_SAVE_NOTICES.independentSection}
          icon={Users}
        >
          {authUser ? (
            <BasicProfileForm userId={authUser.id} initialName={name} email={email} profile={profile} />
          ) : null}
        </ProfileSection>

        <ProfileSection
          title={PROFILE_EDIT_SECTIONS.personalInfo}
          description={PROFILE_EDIT_SAVE_NOTICES.independentSection}
          icon={User}
        >
          {authUser ? (
            <PersonalInfoForm
              userId={authUser.id}
              personalInfo={personalInfo}
              contactDetails={contactDetails}
            />
          ) : null}
        </ProfileSection>

        <ProfileSection
          title={PROFILE_EDIT_SECTIONS.skills}
          description={PROFILE_EDIT_SAVE_NOTICES.autoSave}
          icon={Code2}
        >
          <div className="flex flex-col gap-8">
            {authUser && (
              <TechnicalSkillsManager
                userId={authUser.id}
                initialSkills={userSkills}
                catalog={skillCatalog}
              />
            )}

            <fieldset className="flex flex-col gap-3">
              <legend className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                {SKILLS_SECTION.humanTitle}
              </legend>
              <div className="rounded-xl border border-dashed border-border p-4">
                <p className="text-sm text-muted-foreground">
                  {HUMAN_SKILL_EDIT_NOTE.description}
                </p>
                <Link
                  href={HUMAN_SKILL_EDIT_NOTE.ctaHref}
                  className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {HUMAN_SKILL_EDIT_NOTE.ctaLabel}
                </Link>
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-3">
              <legend className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BrainCircuit className="h-4 w-4 text-primary" aria-hidden="true" />
                {SKILLS_SECTION.businessTitle}
              </legend>
              <div className="rounded-xl border border-dashed border-border p-4">
                <p className="text-sm text-muted-foreground">
                  {BUSINESS_SKILL_EDIT_NOTE.description}
                </p>
                <Link
                  href={BUSINESS_SKILL_EDIT_NOTE.ctaHref}
                  className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {BUSINESS_SKILL_EDIT_NOTE.ctaLabel}
                </Link>
              </div>
            </fieldset>
          </div>
        </ProfileSection>

        <ProfileSection
          title={PROFILE_EDIT_SECTIONS.qualifications}
          description={PROFILE_EDIT_SAVE_NOTICES.autoSave}
          icon={Award}
        >
          {authUser && (
            <QualificationsManager
              userId={authUser.id}
              initialQualifications={userQualifications}
              catalog={qualificationCatalog}
            />
          )}
        </ProfileSection>

        <ProfileSection
          title={PROFILE_EDIT_SECTIONS.workExperience}
          description={PROFILE_EDIT_SAVE_NOTICES.autoSave}
          icon={BriefcaseBusiness}
        >
          {authUser && <WorkExperienceManager userId={authUser.id} initialItems={workExperiences} />}
        </ProfileSection>

        <ProfileSection
          title={PROFILE_EDIT_SECTIONS.education}
          description={PROFILE_EDIT_SAVE_NOTICES.autoSave}
          icon={GraduationCap}
        >
          {authUser && <EducationManager userId={authUser.id} initialItems={educations} />}
        </ProfileSection>

        <ProfileSection
          title={PROFILE_EDIT_SECTIONS.portfolio}
          description={PROFILE_EDIT_SAVE_NOTICES.autoSave}
          icon={FolderGit2}
        >
          {authUser && <PortfolioManager userId={authUser.id} initialItems={portfolioProjects} />}
        </ProfileSection>

        <ProfileSection
          title={PROFILE_EDIT_SECTIONS.languages}
          description={PROFILE_EDIT_SAVE_NOTICES.autoSave}
          icon={LanguagesIcon}
        >
          {authUser && <LanguagesManager userId={authUser.id} initialItems={languages} />}
        </ProfileSection>

        <ProfileSection
          title={PROFILE_EDIT_SECTIONS.preferredConditions}
          description={PROFILE_EDIT_SAVE_NOTICES.autoSave}
          icon={MapPin}
        >
          {authUser && (
            <PreferredConditionsManager
              userId={authUser.id}
              initialContractTypes={preferredContractTypes}
              initialLocations={preferredLocations}
            />
          )}
        </ProfileSection>

        <div className="flex justify-end">
          <Link
            href={PROFILE_EDIT_META.cancelHref}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {PROFILE_EDIT_META.cancelLabel}
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
