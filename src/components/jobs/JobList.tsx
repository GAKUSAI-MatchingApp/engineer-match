"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { JobCard } from "@/components/jobs/JobCard";
import { EmptyState } from "@/components/jobs/EmptyState";
import { Pagination } from "@/components/jobs/Pagination";
import {
  CONTRACT_TYPE_OPTIONS,
  FILTER_LABELS,
  JOB_LIST_META,
  NO_JOBS_STATE_LABELS,
  SORT_OPTIONS,
  WORK_STYLE_OPTIONS,
  type SortOption,
  type WorkStyleFilterValue,
} from "@/constants/jobs";
import type { CompanyContractType, HydratedOpportunity } from "@/lib/engineer/opportunities";
import type { SkillCatalogItem } from "@/lib/engineer/skills";
import { addFavorite, removeFavorite } from "@/lib/engineer/favorites";
import { createClient } from "@/lib/supabase/client";

const SELECT_CLASSNAME =
  "h-11 w-full min-w-0 max-w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

interface JobListProps {
  jobs: HydratedOpportunity[];
  total: number;
  page: number;
  pageSize: number;
  initialFavoriteIds: string[];
  isSignedIn: boolean;
  userId: string | null;
  searchValue: string;
  contractTypeValue: CompanyContractType | "";
  sortValue: SortOption;
  skillCatalog: SkillCatalogItem[];
  skillIdsValue: string[];
  workStyleValue: WorkStyleFilterValue;
}

function buildQueryHref(params: {
  search: string;
  contractType: string;
  sort: string;
  page: number;
  skillIds: string[];
  workStyle: string;
}): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.contractType) query.set("contractType", params.contractType);
  if (params.sort && params.sort !== "newest") query.set("sort", params.sort);
  if (params.page > 1) query.set("page", String(params.page));
  if (params.skillIds.length > 0) query.set("skills", params.skillIds.join(","));
  if (params.workStyle) query.set("workStyle", params.workStyle);
  const queryString = query.toString();
  return queryString ? `/engineer/jobs?${queryString}` : "/engineer/jobs";
}

/** Work style is meaningful for employment/hourly (or the combined view). */
function isWorkStyleFilterAvailable(contractType: CompanyContractType | ""): boolean {
  return contractType === "" || contractType === "employment" || contractType === "hourly";
}

export function JobList({
  jobs,
  total,
  page,
  pageSize,
  initialFavoriteIds,
  isSignedIn,
  userId,
  searchValue,
  contractTypeValue,
  sortValue,
  skillCatalog,
  skillIdsValue,
  workStyleValue,
}: JobListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchValue);
  const [contractType, setContractType] = useState<CompanyContractType | "">(contractTypeValue);
  const [sortOption, setSortOption] = useState<SortOption>(sortValue);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(skillIdsValue);
  const [workStyle, setWorkStyle] = useState<WorkStyleFilterValue>(workStyleValue);
  const [skillQuery, setSkillQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(initialFavoriteIds));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const hasActiveFilters =
    searchValue !== "" ||
    contractTypeValue !== "" ||
    skillIdsValue.length > 0 ||
    workStyleValue !== "";
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const workStyleAvailable = isWorkStyleFilterAvailable(contractType);
  const filteredSkillCatalog = skillCatalog.filter((skill) =>
    skill.name.toLowerCase().includes(skillQuery.trim().toLowerCase()),
  );

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  function applyFilters() {
    router.push(
      buildQueryHref({
        search: searchQuery.trim(),
        contractType,
        sort: sortOption,
        page: 1,
        skillIds: selectedSkillIds,
        workStyle: workStyleAvailable ? workStyle : "",
      }),
    );
  }

  function handleContractTypeChange(next: CompanyContractType | "") {
    setContractType(next);
    if (!isWorkStyleFilterAvailable(next)) {
      setWorkStyle("");
    }
  }

  function toggleSkill(id: string) {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  }

  function handleReset() {
    setSearchQuery("");
    setContractType("");
    setSortOption("newest");
    setSelectedSkillIds([]);
    setWorkStyle("");
    setSkillQuery("");
    router.push("/engineer/jobs");
  }

  async function handleToggleBookmark(id: string) {
    if (!isSignedIn || !userId) {
      showToast(JOB_LIST_META.bookmarkLabel + "にはログインが必要です。");
      return;
    }

    const wasFavorited = favoriteIds.has(id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(id);
      else next.add(id);
      return next;
    });

    const supabase = createClient();
    const { error } = wasFavorited
      ? await removeFavorite(supabase, userId, id)
      : await addFavorite(supabase, userId, id);

    if (error) {
      console.error("[job-list] favorite toggle failed:", error);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.add(id);
        else next.delete(id);
        return next;
      });
      showToast("お気に入り処理に失敗しました。しばらくしてから再度お試しください。");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="min-w-[220px] flex-1">
            <label
              htmlFor="job-search-input"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              {FILTER_LABELS.searchLabel}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="job-search-input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                placeholder={FILTER_LABELS.searchPlaceholder}
                className="h-11 pl-9"
              />
            </div>
          </div>

          <div className="w-full shrink-0 sm:w-40">
            <label
              htmlFor="job-contract-filter"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              {FILTER_LABELS.contractTypeLabel}
            </label>
            <select
              id="job-contract-filter"
              value={contractType}
              onChange={(event) =>
                handleContractTypeChange(event.target.value as CompanyContractType | "")
              }
              className={SELECT_CLASSNAME}
            >
              <option value="">{FILTER_LABELS.contractTypeAllLabel}</option>
              {CONTRACT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full shrink-0 sm:w-44">
            <label
              htmlFor="job-work-style-filter"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              {FILTER_LABELS.workStyleLabel}
            </label>
            <select
              id="job-work-style-filter"
              value={workStyle}
              disabled={!workStyleAvailable}
              onChange={(event) => setWorkStyle(event.target.value as WorkStyleFilterValue)}
              className={SELECT_CLASSNAME}
            >
              <option value="">{FILTER_LABELS.workStyleAllLabel}</option>
              {WORK_STYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {!workStyleAvailable && (
              <p className="mt-1 text-xs text-muted-foreground">
                {FILTER_LABELS.workStyleUnavailableNote}
              </p>
            )}
          </div>

          <div className="w-full shrink-0 sm:w-36">
            <label
              htmlFor="job-sort"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              {FILTER_LABELS.sortLabel}
            </label>
            <select
              id="job-sort"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              className={SELECT_CLASSNAME}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {FILTER_LABELS.searchLabel}
          </button>

          {(hasActiveFilters || sortValue !== "newest") && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {FILTER_LABELS.resetLabel}
            </button>
          )}
        </div>

        {skillCatalog.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              {FILTER_LABELS.skillLabel}
            </p>
            <Input
              value={skillQuery}
              onChange={(event) => setSkillQuery(event.target.value)}
              placeholder={FILTER_LABELS.skillPlaceholder}
              className="h-9 max-w-xs"
            />
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border p-3">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {filteredSkillCatalog.map((skill) => {
                  const checkboxId = `job-skill-filter-${skill.id}`;
                  return (
                    <label
                      key={skill.id}
                      htmlFor={checkboxId}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={selectedSkillIds.includes(skill.id)}
                        onCheckedChange={() => toggleSkill(skill.id)}
                      />
                      {skill.name}
                    </label>
                  );
                })}
              </div>
            </div>
            {selectedSkillIds.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {selectedSkillIds.length}
                {FILTER_LABELS.skillSelectedCountSuffix}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {total}
        {JOB_LIST_META.resultsSuffix}
      </p>

      {total === 0 ? (
        hasActiveFilters ? (
          <EmptyState onReset={handleReset} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-semibold text-foreground">{NO_JOBS_STATE_LABELS.title}</p>
            <p className="text-sm text-muted-foreground">{NO_JOBS_STATE_LABELS.description}</p>
          </div>
        )
      ) : (
        <ul className="flex flex-col gap-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard
                job={job}
                isBookmarked={favoriteIds.has(job.id)}
                onToggleBookmark={handleToggleBookmark}
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        buildHref={(targetPage) =>
          buildQueryHref({
            search: searchValue,
            contractType: contractTypeValue,
            sort: sortValue,
            page: targetPage,
            skillIds: skillIdsValue,
            workStyle: workStyleValue,
          })
        }
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:justify-end sm:pr-6"
        >
          <div className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-white shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
