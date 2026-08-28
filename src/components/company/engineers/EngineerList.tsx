"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EngineerSearchHeader } from "@/components/company/engineers/EngineerSearchHeader";
import { EngineerActiveFilters } from "@/components/company/engineers/EngineerActiveFilters";
import {
  EngineerSearchFilters,
  DEFAULT_ENGINEER_FILTER_STATE,
  type EngineerFilterState,
} from "@/components/company/engineers/EngineerSearchFilters";
import { EngineerFilterDrawer } from "@/components/company/engineers/EngineerFilterDrawer";
import { EngineerCard } from "@/components/company/engineers/EngineerCard";
import { EngineerEmptyState } from "@/components/company/engineers/EngineerEmptyState";
import {
  FILTER_LABELS,
  NO_ENGINEERS_LABELS,
  RESULTS_META,
  SEARCH_LABELS,
  SORT_OPTIONS,
  type SortOption,
} from "@/constants/company-engineers";
import type { EngineerSearchListItem } from "@/lib/company/engineers";

const SELECT_CLASSNAME =
  "h-11 w-full min-w-0 max-w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none";

function getMaxItssLevel(engineer: EngineerSearchListItem): number {
  return engineer.technicalSkills.reduce((max, skill) => Math.max(max, skill.level ?? 0), 0);
}

interface EngineerListProps {
  engineers: EngineerSearchListItem[];
}

export function EngineerList({ engineers }: EngineerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EngineerFilterState>(DEFAULT_ENGINEER_FILTER_STATE);
  const [sortOption, setSortOption] = useState<SortOption | "">("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  function updateFilters(patch: Partial<EngineerFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleClearAll() {
    setSearchQuery("");
    setFilters(DEFAULT_ENGINEER_FILTER_STATE);
  }

  const prefectureOptions = useMemo(
    () =>
      Array.from(
        new Set(engineers.map((engineer) => engineer.prefecture).filter((v): v is string => !!v)),
      ).sort(),
    [engineers],
  );

  const skillOptions = useMemo(
    () =>
      Array.from(
        new Set(engineers.flatMap((engineer) => engineer.technicalSkills.map((skill) => skill.name))),
      ).sort(),
    [engineers],
  );

  const activeFilterCount =
    filters.prefectures.length +
    filters.workStyles.length +
    filters.skills.length +
    filters.itssLevels.length +
    filters.jobCategories.length +
    filters.availabilityStatuses.length +
    (filters.experienceMin !== null ? 1 : 0);

  const filteredEngineers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = engineers.filter((engineer) => {
      if (query) {
        const haystack = [engineer.name, ...engineer.technicalSkills.map((skill) => skill.name)]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.prefectures.length > 0) {
        if (!engineer.prefecture || !filters.prefectures.includes(engineer.prefecture)) return false;
      }
      if (filters.workStyles.length > 0) {
        if (!engineer.workStyle || !filters.workStyles.includes(engineer.workStyle)) return false;
      }
      if (
        filters.skills.length > 0 &&
        !engineer.technicalSkills.some((skill) => filters.skills.includes(skill.name))
      )
        return false;
      if (
        filters.itssLevels.length > 0 &&
        !engineer.technicalSkills.some(
          (skill) => skill.level !== null && filters.itssLevels.includes(skill.level),
        )
      )
        return false;
      if (
        filters.experienceMin !== null &&
        (engineer.yearsOfExperience ?? 0) < filters.experienceMin
      )
        return false;
      if (filters.jobCategories.length > 0) {
        if (!engineer.jobCategory || !filters.jobCategories.includes(engineer.jobCategory))
          return false;
      }
      if (filters.availabilityStatuses.length > 0) {
        if (
          !engineer.availabilityStatus ||
          !filters.availabilityStatuses.includes(engineer.availabilityStatus)
        )
          return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "experience":
          return (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0);
        case "itss":
          return getMaxItssLevel(b) - getMaxItssLevel(a);
        default:
          return a.name.localeCompare(b.name, "ja");
      }
    });

    return sorted;
  }, [engineers, searchQuery, filters, sortOption]);

  if (engineers.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EngineerSearchHeader />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">{NO_ENGINEERS_LABELS.title}</p>
          <p className="text-sm text-muted-foreground">{NO_ENGINEERS_LABELS.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-3">
        <EngineerSearchHeader />

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <label htmlFor="engineer-search-input" className="sr-only">
                {SEARCH_LABELS.label}
              </label>
              <Input
                id="engineer-search-input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={SEARCH_LABELS.placeholder}
                className="h-11 pl-9"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              aria-label={FILTER_LABELS.openLabel}
              className="relative inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{FILTER_LABELS.openLabel}</span>
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white"
                  aria-hidden="true"
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <EngineerActiveFilters
          searchQuery={searchQuery}
          filters={filters}
          onSearchChange={setSearchQuery}
          onFilterChange={updateFilters}
          onClearAll={handleClearAll}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filteredEngineers.length}
            {RESULTS_META.resultsSuffix}
          </p>
          <div className="w-full sm:w-56">
            <label htmlFor="engineer-sort" className="sr-only">
              並び替え
            </label>
            <select
              id="engineer-sort"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption | "")}
              className={SELECT_CLASSNAME}
            >
              <option value="">おすすめ順</option>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredEngineers.length === 0 ? (
          <EngineerEmptyState onReset={handleClearAll} />
        ) : (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredEngineers.map((engineer) => (
              <li key={engineer.id}>
                <EngineerCard engineer={engineer} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
        <EngineerSearchFilters
          filters={filters}
          onChange={updateFilters}
          prefectureOptions={prefectureOptions}
          skillOptions={skillOptions}
        />
      </div>

      <EngineerFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChange={updateFilters}
        resultCount={filteredEngineers.length}
        prefectureOptions={prefectureOptions}
        skillOptions={skillOptions}
      />
    </div>
  );
}
