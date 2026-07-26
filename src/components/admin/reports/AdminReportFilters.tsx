"use client";

import {
  AdminFilterBar,
  AdminFilterChipGroup,
  toggleFilterValue,
} from "@/components/admin/shared/AdminFilterBar";
import {
  ADMIN_REPORT_DATE_RANGE_OPTIONS,
  ADMIN_REPORT_FILTER_LABELS,
  ADMIN_REPORT_STATUS_LABEL,
  ADMIN_REPORT_STATUS_OPTIONS,
  ADMIN_REPORT_TARGET_TYPE_LABEL,
  ADMIN_REPORT_TARGET_TYPE_OPTIONS,
  DEFAULT_ADMIN_REPORT_FILTER_STATE,
  type AdminReportFilterState,
} from "@/constants/admin-reports";
import type { AdminReportStatus, AdminReportTargetType } from "@/lib/admin/reports";
import { cn } from "@/lib/utils";

interface AdminReportFiltersProps {
  filters: AdminReportFilterState;
  onChange: (patch: Partial<AdminReportFilterState>) => void;
}

export function AdminReportFilters({ filters, onChange }: AdminReportFiltersProps) {
  const statusLabels = ADMIN_REPORT_STATUS_OPTIONS.map((code) => ADMIN_REPORT_STATUS_LABEL[code]);
  const targetTypeLabels = ADMIN_REPORT_TARGET_TYPE_OPTIONS.map((code) => ADMIN_REPORT_TARGET_TYPE_LABEL[code]);

  return (
    <AdminFilterBar
      title={ADMIN_REPORT_FILTER_LABELS.title}
      resetLabel={ADMIN_REPORT_FILTER_LABELS.resetLabel}
      onReset={() => onChange(DEFAULT_ADMIN_REPORT_FILTER_STATE)}
    >
      <AdminFilterChipGroup
        legend={ADMIN_REPORT_FILTER_LABELS.status}
        idPrefix="report-status"
        options={statusLabels}
        selected={filters.statuses.map((code) => ADMIN_REPORT_STATUS_LABEL[code as AdminReportStatus])}
        onToggle={(label) => {
          const code = ADMIN_REPORT_STATUS_OPTIONS.find((c) => ADMIN_REPORT_STATUS_LABEL[c] === label) as string;
          onChange({ statuses: toggleFilterValue(filters.statuses, code) });
        }}
      />
      <AdminFilterChipGroup
        legend={ADMIN_REPORT_FILTER_LABELS.targetType}
        idPrefix="report-target"
        options={targetTypeLabels}
        selected={filters.targetTypes.map(
          (code) => ADMIN_REPORT_TARGET_TYPE_LABEL[code as AdminReportTargetType],
        )}
        onToggle={(label) => {
          const code = ADMIN_REPORT_TARGET_TYPE_OPTIONS.find(
            (c) => ADMIN_REPORT_TARGET_TYPE_LABEL[c] === label,
          ) as string;
          onChange({ targetTypes: toggleFilterValue(filters.targetTypes, code) });
        }}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold text-muted-foreground">
          {ADMIN_REPORT_FILTER_LABELS.reportedWithin}
        </legend>
        <div className="flex flex-wrap gap-2">
          {ADMIN_REPORT_DATE_RANGE_OPTIONS.map((option) => {
            const isSelected = option.days === filters.reportedWithinDays;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ reportedWithinDays: option.days })}
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
