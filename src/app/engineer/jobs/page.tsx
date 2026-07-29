import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SearchHeader } from "@/components/jobs/SearchHeader";
import { JobList } from "@/components/jobs/JobList";
import { ENGINEER_NAV } from "@/constants/dashboard";
import {
  ERROR_STATE_LABELS,
  LOADING_STATE_LABELS,
  SEARCH_HEADER,
  SIGN_IN_REQUIRED_LABELS,
  type SortOption,
  type WorkStyleFilterValue,
} from "@/constants/jobs";
import { createClient } from "@/lib/supabase/server";
import {
  listPublishedOpportunities,
  type CompanyContractType,
  type WorkStyleValue,
} from "@/lib/engineer/opportunities";
import { listMyFavoriteOpportunityIds } from "@/lib/engineer/favorites";
import { getEngineerHeaderIdentity } from "@/lib/engineer/profile";
import { listSkillCatalog } from "@/lib/engineer/skills";

const WORK_STYLE_VALUES: readonly WorkStyleValue[] = ["REMOTE", "ONSITE", "HYBRID"];

export const metadata: Metadata = {
  title: "求人・案件検索 | ENGINEER MATCH",
  description: "エンジニア向けの求人・案件を検索できます。",
};

interface EngineerJobsPageProps {
  searchParams: Promise<{
    search?: string;
    contractType?: string;
    sort?: string;
    skills?: string;
    workStyle?: string;
  }>;
}

function SignInRequired() {
  return (
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
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{LOADING_STATE_LABELS.message}</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
      <p className="text-sm font-semibold text-foreground">{ERROR_STATE_LABELS.title}</p>
      <p className="text-sm text-muted-foreground">{ERROR_STATE_LABELS.description}</p>
    </div>
  );
}

async function JobListSection({
  search,
  contractType,
  sort,
  skillIds,
  workStyle,
}: {
  search: string;
  contractType: CompanyContractType | "";
  sort: SortOption;
  skillIds: string[];
  workStyle: WorkStyleFilterValue;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return <SignInRequired />;
  }

  const [result, favoriteIds, skillCatalog] = await Promise.all([
    listPublishedOpportunities(supabase, {
      search,
      contractType: contractType || null,
      skillIds,
      workStyle: workStyle || null,
      sort,
    }),
    listMyFavoriteOpportunityIds(supabase, authUser.id),
    listSkillCatalog(supabase),
  ]);

  if (result.error) {
    return <ErrorState />;
  }

  return (
    <JobList
      jobs={result.items}
      total={result.total}
      initialFavoriteIds={[...favoriteIds]}
      isSignedIn
      userId={authUser.id}
      searchValue={search}
      contractTypeValue={contractType}
      sortValue={sort}
      skillCatalog={skillCatalog}
      skillIdsValue={skillIds}
      workStyleValue={workStyle}
    />
  );
}

export default async function EngineerJobsPage({ searchParams }: EngineerJobsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const identity = await getEngineerHeaderIdentity(supabase, authUser);

  const search = params.search?.trim() ?? "";
  const contractType = (
    ["employment", "project", "hourly"].includes(params.contractType ?? "")
      ? params.contractType
      : ""
  ) as CompanyContractType | "";
  const sort: SortOption = params.sort === "oldest" ? "oldest" : "newest";
  const skillIds = (params.skills ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const supportsWorkStyle =
    contractType === "" || contractType === "employment" || contractType === "hourly";
  const workStyle: WorkStyleFilterValue =
    supportsWorkStyle &&
    (WORK_STYLE_VALUES as readonly string[]).includes(params.workStyle ?? "")
      ? (params.workStyle as WorkStyleFilterValue)
      : "";

  return (
    <DashboardShell
      navItems={ENGINEER_NAV}
      activeHref="/engineer/jobs"
      pageTitle={SEARCH_HEADER.title}
      userName={identity.name}
      userInitials={identity.initials}
      userEmail={identity.email}
    >
      <SearchHeader />
      <Suspense
        fallback={<LoadingState />}
        key={`${search}-${contractType}-${sort}-${skillIds.join(".")}-${workStyle}`}
      >
        <JobListSection
          search={search}
          contractType={contractType}
          sort={sort}
          skillIds={skillIds}
          workStyle={workStyle}
        />
      </Suspense>
    </DashboardShell>
  );
}
