"use client";

import {
  AdminFilterBar,
  AdminFilterChipGroup,
  toggleFilterValue,
} from "@/components/admin/shared/AdminFilterBar";
import {
  ADMIN_USER_DATE_RANGE_OPTIONS,
  ADMIN_USER_FILTER_LABELS,
  ADMIN_USER_ROLE_LABEL,
  ADMIN_USER_ROLE_OPTIONS,
  ADMIN_USER_STATUS_LABEL,
  ADMIN_USER_STATUS_OPTIONS,
  DEFAULT_ADMIN_USER_FILTER_STATE,
  type AdminUserFilterState,
  type AdminUserRole,
  type AdminUserStatus,
} from "@/constants/admin-users";
import { cn } from "@/lib/utils";

interface AdminUserFiltersProps {
  filters: AdminUserFilterState;
  onChange: (patch: Partial<AdminUserFilterState>) => void;
}

function DateRangeGroup({
  legend,
  selected,
  onSelect,
}: {
  legend: string;
  selected: number | null;
  onSelect: (days: number | null) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-semibold text-muted-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {ADMIN_USER_DATE_RANGE_OPTIONS.map((option) => {
          const isSelected = option.days === selected;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(option.days)}
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
  );
}

export function AdminUserFilters({ filters, onChange }: AdminUserFiltersProps) {
  const roleLabels = ADMIN_USER_ROLE_OPTIONS.map((code) => ADMIN_USER_ROLE_LABEL[code]);
  const statusLabels = ADMIN_USER_STATUS_OPTIONS.map((code) => ADMIN_USER_STATUS_LABEL[code]);

  return (
    <AdminFilterBar
      title={ADMIN_USER_FILTER_LABELS.title}
      resetLabel={ADMIN_USER_FILTER_LABELS.resetLabel}
      onReset={() => onChange(DEFAULT_ADMIN_USER_FILTER_STATE)}
    >
      <AdminFilterChipGroup
        legend={ADMIN_USER_FILTER_LABELS.role}
        idPrefix="user-role"
        options={roleLabels}
        selected={filters.roles.map((code) => ADMIN_USER_ROLE_LABEL[code])}
        onToggle={(label) => {
          const code = ADMIN_USER_ROLE_OPTIONS.find(
            (c) => ADMIN_USER_ROLE_LABEL[c] === label,
          ) as AdminUserRole;
          onChange({ roles: toggleFilterValue(filters.roles, code) });
        }}
      />
      <AdminFilterChipGroup
        legend={ADMIN_USER_FILTER_LABELS.accountStatus}
        idPrefix="user-account-status"
        options={statusLabels}
        selected={filters.statuses.map((code) => ADMIN_USER_STATUS_LABEL[code])}
        onToggle={(label) => {
          const code = ADMIN_USER_STATUS_OPTIONS.find(
            (c) => ADMIN_USER_STATUS_LABEL[c] === label,
          ) as AdminUserStatus;
          onChange({ statuses: toggleFilterValue(filters.statuses, code) });
        }}
      />
      <DateRangeGroup
        legend={ADMIN_USER_FILTER_LABELS.registeredWithin}
        selected={filters.registeredWithinDays}
        onSelect={(days) => onChange({ registeredWithinDays: days })}
      />
    </AdminFilterBar>
  );
}
