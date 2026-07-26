"use client";

import {
  AdminFilterBar,
  AdminFilterChipGroup,
  toggleFilterValue,
} from "@/components/admin/shared/AdminFilterBar";
import {
  ADMIN_COMPANY_DATE_RANGE_OPTIONS,
  ADMIN_COMPANY_FILTER_LABELS,
  ADMIN_COMPANY_SIZE_LABEL,
  ADMIN_COMPANY_SIZE_OPTIONS,
  ADMIN_COMPANY_USAGE_STATUS_LABEL,
  ADMIN_COMPANY_USAGE_STATUS_OPTIONS,
  DEFAULT_ADMIN_COMPANY_FILTER_STATE,
  type AdminCompanyFilterState,
} from "@/constants/admin-companies";
import type { AdminUserStatus } from "@/lib/admin/users";
import { cn } from "@/lib/utils";

interface AdminCompanyFiltersProps {
  filters: AdminCompanyFilterState;
  onChange: (patch: Partial<AdminCompanyFilterState>) => void;
  availableIndustries: string[];
}

export function AdminCompanyFilters({ filters, onChange, availableIndustries }: AdminCompanyFiltersProps) {
  const statusLabels = ADMIN_COMPANY_USAGE_STATUS_OPTIONS.map((code) => ADMIN_COMPANY_USAGE_STATUS_LABEL[code]);
  const sizeLabels = ADMIN_COMPANY_SIZE_OPTIONS.map((code) => ADMIN_COMPANY_SIZE_LABEL[code]);

  return (
    <AdminFilterBar
      title={ADMIN_COMPANY_FILTER_LABELS.title}
      resetLabel={ADMIN_COMPANY_FILTER_LABELS.resetLabel}
      onReset={() => onChange(DEFAULT_ADMIN_COMPANY_FILTER_STATE)}
    >
      <AdminFilterChipGroup
        legend={ADMIN_COMPANY_FILTER_LABELS.usageStatus}
        idPrefix="company-usage-status"
        options={statusLabels}
        selected={filters.usageStatuses.map((code) => ADMIN_COMPANY_USAGE_STATUS_LABEL[code])}
        onToggle={(label) => {
          const code = ADMIN_COMPANY_USAGE_STATUS_OPTIONS.find(
            (c) => ADMIN_COMPANY_USAGE_STATUS_LABEL[c] === label,
          ) as AdminUserStatus;
          onChange({ usageStatuses: toggleFilterValue(filters.usageStatuses, code) });
        }}
      />
      <AdminFilterChipGroup
        legend={ADMIN_COMPANY_FILTER_LABELS.industry}
        idPrefix="company-industry"
        options={availableIndustries}
        selected={filters.industries}
        onToggle={(value) => onChange({ industries: toggleFilterValue(filters.industries, value) })}
      />
      <AdminFilterChipGroup
        legend={ADMIN_COMPANY_FILTER_LABELS.companySize}
        idPrefix="company-size"
        options={sizeLabels}
        selected={filters.companySizes.map((code) => ADMIN_COMPANY_SIZE_LABEL[code])}
        onToggle={(label) => {
          const code = ADMIN_COMPANY_SIZE_OPTIONS.find((c) => ADMIN_COMPANY_SIZE_LABEL[c] === label) as string;
          onChange({ companySizes: toggleFilterValue(filters.companySizes, code) });
        }}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold text-muted-foreground">
          {ADMIN_COMPANY_FILTER_LABELS.registeredWithin}
        </legend>
        <div className="flex flex-wrap gap-2">
          {ADMIN_COMPANY_DATE_RANGE_OPTIONS.map((option) => {
            const isSelected = option.days === filters.registeredWithinDays;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ registeredWithinDays: option.days })}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-border text-foreground hover:bg-muted",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </AdminFilterBar>
  );
}
