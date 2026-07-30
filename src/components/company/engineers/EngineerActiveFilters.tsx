"use client";

import { X } from "lucide-react";
import type { EngineerFilterState } from "@/components/company/engineers/EngineerSearchFilters";
import {
  ACTIVE_FILTERS_LABELS,
  EXPERIENCE_BUCKET_OPTIONS,
  WORK_STYLE_FILTER_OPTIONS,
} from "@/constants/company-engineers";
import { AVAILABILITY_STATUS_OPTIONS, JOB_CATEGORY_OPTIONS } from "@/constants/engineer-profile";
import { formatItssLevelLabel, type ItssLevel } from "@/constants/skill-levels";

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface EngineerActiveFiltersProps {
  searchQuery: string;
  filters: EngineerFilterState;
  onSearchChange: (value: string) => void;
  onFilterChange: (patch: Partial<EngineerFilterState>) => void;
  onClearAll: () => void;
}

export function EngineerActiveFilters({
  searchQuery,
  filters,
  onSearchChange,
  onFilterChange,
  onClearAll,
}: EngineerActiveFiltersProps) {
  const chips: Chip[] = [];

  if (searchQuery.trim() !== "") {
    chips.push({
      key: "search",
      label: `キーワード：${searchQuery}`,
      onRemove: () => onSearchChange(""),
    });
  }

  for (const value of filters.prefectures) {
    chips.push({
      key: `prefecture-${value}`,
      label: value,
      onRemove: () =>
        onFilterChange({ prefectures: filters.prefectures.filter((item) => item !== value) }),
    });
  }
  for (const value of filters.workStyles) {
    const option = WORK_STYLE_FILTER_OPTIONS.find((item) => item.value === value);
    chips.push({
      key: `work-style-${value}`,
      label: option?.label ?? value,
      onRemove: () =>
        onFilterChange({ workStyles: filters.workStyles.filter((item) => item !== value) }),
    });
  }
  for (const value of filters.skills) {
    chips.push({
      key: `skill-${value}`,
      label: value,
      onRemove: () => onFilterChange({ skills: filters.skills.filter((item) => item !== value) }),
    });
  }
  for (const value of filters.itssLevels) {
    chips.push({
      key: `itss-${value}`,
      label: `${ACTIVE_FILTERS_LABELS.itssPrefix} ${formatItssLevelLabel(value as ItssLevel)}`,
      onRemove: () =>
        onFilterChange({ itssLevels: filters.itssLevels.filter((item) => item !== value) }),
    });
  }
  for (const value of filters.jobCategories) {
    const option = JOB_CATEGORY_OPTIONS.find((item) => item.value === value);
    chips.push({
      key: `job-category-${value}`,
      label: option?.label ?? value,
      onRemove: () =>
        onFilterChange({ jobCategories: filters.jobCategories.filter((item) => item !== value) }),
    });
  }
  for (const value of filters.availabilityStatuses) {
    const option = AVAILABILITY_STATUS_OPTIONS.find((item) => item.value === value);
    chips.push({
      key: `availability-${value}`,
      label: option?.label ?? value,
      onRemove: () =>
        onFilterChange({
          availabilityStatuses: filters.availabilityStatuses.filter((item) => item !== value),
        }),
    });
  }
  if (filters.experienceMin !== null) {
    const option = EXPERIENCE_BUCKET_OPTIONS.find((item) => item.value === filters.experienceMin);
    if (option) {
      chips.push({
        key: "experience",
        label: option.label,
        onRemove: () => onFilterChange({ experienceMin: null }),
      });
    }
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="適用中の絞り込み条件">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          aria-label={`${ACTIVE_FILTERS_LABELS.removeLabelPrefix}${chip.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 py-1.5 pr-2 pl-3 text-xs font-medium text-primary transition-colors duration-200 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded text-xs font-semibold text-muted-foreground underline underline-offset-2 transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {ACTIVE_FILTERS_LABELS.clearAllLabel}
      </button>
    </div>
  );
}
