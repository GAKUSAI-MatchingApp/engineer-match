"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EXPERIENCE_BUCKET_OPTIONS,
  FILTER_LABELS,
  ITSS_LEVEL_OPTIONS,
  WORK_STYLE_FILTER_OPTIONS,
  type ExperienceBucket,
} from "@/constants/company-engineers";
import { AVAILABILITY_STATUS_OPTIONS, JOB_CATEGORY_OPTIONS } from "@/constants/engineer-profile";
import { formatItssLevelLabel } from "@/constants/skill-levels";

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export interface EngineerFilterState {
  prefectures: string[];
  workStyles: string[];
  skills: string[];
  itssLevels: number[];
  experienceMin: ExperienceBucket;
  jobCategories: string[];
  availabilityStatuses: string[];
}

export const DEFAULT_ENGINEER_FILTER_STATE: EngineerFilterState = {
  prefectures: [],
  workStyles: [],
  skills: [],
  itssLevels: [],
  experienceMin: null,
  jobCategories: [],
  availabilityStatuses: [],
};

interface CheckboxGroupProps {
  legend: string;
  idPrefix: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}

function CheckboxGroup({ legend, idPrefix, options, selected, onToggle }: CheckboxGroupProps) {
  if (options.length === 0) return null;

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="text-sm font-semibold text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2.5">
        {options.map((option) => {
          const id = `${idPrefix}-${option}`;
          return (
            <label
              key={option}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <Checkbox
                id={id}
                checked={selected.includes(option)}
                onCheckedChange={() => onToggle(option)}
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface EngineerFilterFieldsProps {
  filters: EngineerFilterState;
  onChange: (patch: Partial<EngineerFilterState>) => void;
  idPrefix: string;
  prefectureOptions: string[];
  skillOptions: string[];
}

export function EngineerFilterFields({
  filters,
  onChange,
  idPrefix,
  prefectureOptions,
  skillOptions,
}: EngineerFilterFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <CheckboxGroup
        legend={FILTER_LABELS.prefectures}
        idPrefix={`${idPrefix}-prefecture`}
        options={prefectureOptions}
        selected={filters.prefectures}
        onToggle={(value) => onChange({ prefectures: toggleValue(filters.prefectures, value) })}
      />

      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-sm font-semibold text-foreground">
          {FILTER_LABELS.workStyles}
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2.5">
          {WORK_STYLE_FILTER_OPTIONS.map((option) => {
            const id = `${idPrefix}-work-style-${option.value}`;
            return (
              <label
                key={option.value}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
              >
                <Checkbox
                  id={id}
                  checked={filters.workStyles.includes(option.value)}
                  onCheckedChange={() =>
                    onChange({ workStyles: toggleValue(filters.workStyles, option.value) })
                  }
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <CheckboxGroup
        legend={FILTER_LABELS.skills}
        idPrefix={`${idPrefix}-skill`}
        options={skillOptions}
        selected={filters.skills}
        onToggle={(value) => onChange({ skills: toggleValue(filters.skills, value) })}
      />

      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-sm font-semibold text-foreground">
          {FILTER_LABELS.itssLevels}
        </legend>
        <div className="flex flex-wrap gap-2">
          {ITSS_LEVEL_OPTIONS.map((level) => {
            const isSelected = filters.itssLevels.includes(level);
            return (
              <button
                key={level}
                type="button"
                aria-pressed={isSelected}
                aria-label={`ITSS ${formatItssLevelLabel(level)}`}
                title={formatItssLevelLabel(level)}
                onClick={() => onChange({ itssLevels: toggleValue(filters.itssLevels, level) })}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-sm font-semibold text-foreground">
          {FILTER_LABELS.jobCategories}
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2.5">
          {JOB_CATEGORY_OPTIONS.map((option) => {
            const id = `${idPrefix}-job-category-${option.value}`;
            return (
              <label
                key={option.value}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
              >
                <Checkbox
                  id={id}
                  checked={filters.jobCategories.includes(option.value)}
                  onCheckedChange={() =>
                    onChange({ jobCategories: toggleValue(filters.jobCategories, option.value) })
                  }
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-sm font-semibold text-foreground">
          {FILTER_LABELS.availabilityStatuses}
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2.5">
          {AVAILABILITY_STATUS_OPTIONS.map((option) => {
            const id = `${idPrefix}-availability-${option.value}`;
            return (
              <label
                key={option.value}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
              >
                <Checkbox
                  id={id}
                  checked={filters.availabilityStatuses.includes(option.value)}
                  onCheckedChange={() =>
                    onChange({
                      availabilityStatuses: toggleValue(filters.availabilityStatuses, option.value),
                    })
                  }
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-sm font-semibold text-foreground">
          {FILTER_LABELS.experience}
        </legend>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_BUCKET_OPTIONS.map((option) => {
            const isSelected = option.value === filters.experienceMin;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ experienceMin: option.value })}
                className={`inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => onChange(DEFAULT_ENGINEER_FILTER_STATE)}
        className="inline-flex h-10 w-fit items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        {FILTER_LABELS.resetLabel}
      </button>
    </div>
  );
}

interface EngineerSearchFiltersProps {
  filters: EngineerFilterState;
  onChange: (patch: Partial<EngineerFilterState>) => void;
  prefectureOptions: string[];
  skillOptions: string[];
}

export function EngineerSearchFilters({
  filters,
  onChange,
  prefectureOptions,
  skillOptions,
}: EngineerSearchFiltersProps) {
  return (
    <div className="hidden rounded-2xl border border-border bg-surface p-6 shadow-sm lg:block">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-base font-semibold text-foreground">{FILTER_LABELS.title}</h3>
      </div>
      <div className="mt-6 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
        <EngineerFilterFields
          filters={filters}
          onChange={onChange}
          idPrefix="sidebar"
          prefectureOptions={prefectureOptions}
          skillOptions={skillOptions}
        />
      </div>
    </div>
  );
}
