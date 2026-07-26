"use client";

import {
  AdminFilterBar,
  AdminFilterChipGroup,
  toggleFilterValue,
} from "@/components/admin/shared/AdminFilterBar";
import {
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL,
  ADMIN_OPPORTUNITY_CONTRACT_TYPE_OPTIONS,
  ADMIN_OPPORTUNITY_DATE_RANGE_OPTIONS,
  ADMIN_OPPORTUNITY_FILTER_LABELS,
  ADMIN_OPPORTUNITY_STATUS_LABEL,
  ADMIN_OPPORTUNITY_STATUS_OPTIONS,
  DEFAULT_ADMIN_OPPORTUNITY_FILTER_STATE,
  type AdminOpportunityFilterState,
} from "@/constants/admin-opportunities";
import type { AdminOpportunityContractType, AdminOpportunityStatus } from "@/lib/admin/opportunities";
import { cn } from "@/lib/utils";

interface AdminOpportunityFiltersProps {
  filters: AdminOpportunityFilterState;
  onChange: (patch: Partial<AdminOpportunityFilterState>) => void;
}

export function AdminOpportunityFilters({ filters, onChange }: AdminOpportunityFiltersProps) {
  const contractTypeLabels = ADMIN_OPPORTUNITY_CONTRACT_TYPE_OPTIONS.map(
    (code) => ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[code],
  );
  const statusLabels = ADMIN_OPPORTUNITY_STATUS_OPTIONS.map((code) => ADMIN_OPPORTUNITY_STATUS_LABEL[code]);

  return (
    <AdminFilterBar
      title={ADMIN_OPPORTUNITY_FILTER_LABELS.title}
      resetLabel={ADMIN_OPPORTUNITY_FILTER_LABELS.resetLabel}
      onReset={() => onChange(DEFAULT_ADMIN_OPPORTUNITY_FILTER_STATE)}
    >
      <AdminFilterChipGroup
        legend={ADMIN_OPPORTUNITY_FILTER_LABELS.contractType}
        idPrefix="opp-contract"
        options={contractTypeLabels}
        selected={filters.contractTypes.map(
          (code) => ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[code as AdminOpportunityContractType],
        )}
        onToggle={(label) => {
          const code = ADMIN_OPPORTUNITY_CONTRACT_TYPE_OPTIONS.find(
            (c) => ADMIN_OPPORTUNITY_CONTRACT_TYPE_LABEL[c] === label,
          ) as string;
          onChange({ contractTypes: toggleFilterValue(filters.contractTypes, code) });
        }}
      />
      <AdminFilterChipGroup
        legend={ADMIN_OPPORTUNITY_FILTER_LABELS.status}
        idPrefix="opp-status"
        options={statusLabels}
        selected={filters.statuses.map(
          (code) => ADMIN_OPPORTUNITY_STATUS_LABEL[code as AdminOpportunityStatus],
        )}
        onToggle={(label) => {
          const code = ADMIN_OPPORTUNITY_STATUS_OPTIONS.find(
            (c) => ADMIN_OPPORTUNITY_STATUS_LABEL[c] === label,
          ) as string;
          onChange({ statuses: toggleFilterValue(filters.statuses, code) });
        }}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold text-muted-foreground">
          {ADMIN_OPPORTUNITY_FILTER_LABELS.postedWithin}
        </legend>
        <div className="flex flex-wrap gap-2">
          {ADMIN_OPPORTUNITY_DATE_RANGE_OPTIONS.map((option) => {
            const isSelected = option.days === filters.postedWithinDays;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ postedWithinDays: option.days })}
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
