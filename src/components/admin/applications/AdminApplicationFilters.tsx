"use client";

import {
  AdminFilterBar,
  AdminFilterChipGroup,
  toggleFilterValue,
} from "@/components/admin/shared/AdminFilterBar";
import {
  ADMIN_APPLICATION_CONTRACT_TYPE_OPTIONS,
  ADMIN_APPLICATION_DATE_RANGE_OPTIONS,
  ADMIN_APPLICATION_FILTER_LABELS,
  ADMIN_APPLICATION_STATUS_LABEL,
  ADMIN_APPLICATION_STATUS_OPTIONS,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL,
  DEFAULT_ADMIN_APPLICATION_FILTER_STATE,
  type AdminApplicationFilterState,
} from "@/constants/admin-applications";
import type { AdminApplicationStatus } from "@/lib/admin/applications";
import type { AdminOpportunityContractType } from "@/lib/admin/opportunities";
import { cn } from "@/lib/utils";

interface AdminApplicationFiltersProps {
  filters: AdminApplicationFilterState;
  onChange: (patch: Partial<AdminApplicationFilterState>) => void;
}

export function AdminApplicationFilters({ filters, onChange }: AdminApplicationFiltersProps) {
  const statusLabels = ADMIN_APPLICATION_STATUS_OPTIONS.map((code) => ADMIN_APPLICATION_STATUS_LABEL[code]);
  const contractTypeLabels = ADMIN_APPLICATION_CONTRACT_TYPE_OPTIONS.map(
    (code) => ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[code],
  );

  return (
    <AdminFilterBar
      title={ADMIN_APPLICATION_FILTER_LABELS.title}
      resetLabel={ADMIN_APPLICATION_FILTER_LABELS.resetLabel}
      onReset={() => onChange(DEFAULT_ADMIN_APPLICATION_FILTER_STATE)}
    >
      <AdminFilterChipGroup
        legend={ADMIN_APPLICATION_FILTER_LABELS.status}
        idPrefix="application-status"
        options={statusLabels}
        selected={filters.statuses.map((code) => ADMIN_APPLICATION_STATUS_LABEL[code as AdminApplicationStatus])}
        onToggle={(label) => {
          const code = ADMIN_APPLICATION_STATUS_OPTIONS.find(
            (c) => ADMIN_APPLICATION_STATUS_LABEL[c] === label,
          ) as string;
          onChange({ statuses: toggleFilterValue(filters.statuses, code) });
        }}
      />
      <AdminFilterChipGroup
        legend={ADMIN_APPLICATION_FILTER_LABELS.contractType}
        idPrefix="application-contract"
        options={contractTypeLabels}
        selected={filters.contractTypes.map(
          (code) => ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[code as AdminOpportunityContractType],
        )}
        onToggle={(label) => {
          const code = ADMIN_APPLICATION_CONTRACT_TYPE_OPTIONS.find(
            (c) => ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[c] === label,
          ) as string;
          onChange({ contractTypes: toggleFilterValue(filters.contractTypes, code) });
        }}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold text-muted-foreground">
          {ADMIN_APPLICATION_FILTER_LABELS.appliedWithin}
        </legend>
        <div className="flex flex-wrap gap-2">
          {ADMIN_APPLICATION_DATE_RANGE_OPTIONS.map((option) => {
            const isSelected = option.days === filters.appliedWithinDays;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ appliedWithinDays: option.days })}
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
