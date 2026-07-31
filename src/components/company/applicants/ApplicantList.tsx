"use client";

import { useMemo, useState } from "react";
import { ApplicantSummaryCards } from "@/components/company/applicants/ApplicantSummaryCards";
import { ApplicantSearchBar } from "@/components/company/applicants/ApplicantSearchBar";
import {
  ApplicantFilters,
  type ApplicantFiltersState,
} from "@/components/company/applicants/ApplicantFilters";
import { ApplicantCard } from "@/components/company/applicants/ApplicantCard";
import type { ApplicantListItem } from "@/lib/company/applicants";
import {
  APPLICANT_LIST_META,
  EMPTY_STATE_LABELS,
  FILTERED_EMPTY_STATE_LABELS,
  type SortOption,
} from "@/constants/company-applicants";

const DEFAULT_FILTERS: ApplicantFiltersState = {
  status: "all",
  appliedJob: "all",
  experienceYears: null,
  location: "all",
};

interface ApplicantListProps {
  applicants: ApplicantListItem[];
  /** Pre-selects the "応募求人" filter, e.g. when arriving from a specific job card's "応募者確認" link. Ignored if it doesn't match any applicant's job title. */
  initialAppliedJob?: string;
}

export function ApplicantList({ applicants, initialAppliedJob }: ApplicantListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ApplicantFiltersState>(() =>
    initialAppliedJob && applicants.some((item) => item.opportunityTitle === initialAppliedJob)
      ? { ...DEFAULT_FILTERS, appliedJob: initialAppliedJob }
      : DEFAULT_FILTERS,
  );
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  function updateFilters(patch: Partial<ApplicantFiltersState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleReset() {
    setSearchQuery("");
    setFilters(DEFAULT_FILTERS);
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filters.status !== "all" ||
    filters.appliedJob !== "all" ||
    filters.experienceYears !== null ||
    filters.location !== "all";

  const appliedJobOptions = useMemo(
    () => Array.from(new Set(applicants.map((item) => item.opportunityTitle))).sort(),
    [applicants],
  );

  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set(applicants.map((item) => item.prefecture).filter((v): v is string => !!v)),
      ).sort(),
    [applicants],
  );

  const visibleApplicants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = applicants.filter((applicant) => {
      if (query) {
        const haystack =
          `${applicant.name} ${applicant.opportunityTitle} ${applicant.skills.join(" ")}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.status !== "all" && applicant.status !== filters.status) return false;
      if (filters.appliedJob !== "all" && applicant.opportunityTitle !== filters.appliedJob)
        return false;
      if (
        filters.experienceYears !== null &&
        (applicant.yearsOfExperience ?? 0) < filters.experienceYears
      )
        return false;
      if (filters.location !== "all" && applicant.prefecture !== filters.location) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return a.appliedAt.localeCompare(b.appliedAt);
        case "experience":
          return (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0);
        case "newest":
        default:
          return b.appliedAt.localeCompare(a.appliedAt);
      }
    });

    return sorted;
  }, [applicants, searchQuery, filters, sortOption]);

  if (applicants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-semibold text-foreground">
          {EMPTY_STATE_LABELS.title}
        </p>
        <p className="text-sm text-muted-foreground">
          {EMPTY_STATE_LABELS.description}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ApplicantSummaryCards applicants={applicants} />

      <ApplicantSearchBar value={searchQuery} onChange={setSearchQuery} />

      <ApplicantFilters
        filters={filters}
        onChange={updateFilters}
        sortOption={sortOption}
        onSortChange={setSortOption}
        appliedJobOptions={appliedJobOptions}
        locationOptions={locationOptions}
        hasActiveFilters={hasActiveFilters}
        onReset={handleReset}
      />

      <p className="text-sm text-muted-foreground">
        {visibleApplicants.length}
        {APPLICANT_LIST_META.resultsSuffix}
      </p>

      {visibleApplicants.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {FILTERED_EMPTY_STATE_LABELS.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {FILTERED_EMPTY_STATE_LABELS.description}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {FILTERED_EMPTY_STATE_LABELS.ctaLabel}
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visibleApplicants.map((applicant) => (
            <li key={applicant.id}>
              <ApplicantCard applicant={applicant} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
