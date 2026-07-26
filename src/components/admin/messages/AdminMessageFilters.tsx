"use client";

import { AdminFilterBar } from "@/components/admin/shared/AdminFilterBar";
import {
  ADMIN_MESSAGE_DATE_RANGE_OPTIONS,
  ADMIN_MESSAGE_FILTER_LABELS,
  DEFAULT_ADMIN_MESSAGE_FILTER_STATE,
  type AdminMessageFilterState,
} from "@/constants/admin-messages";
import { cn } from "@/lib/utils";

interface AdminMessageFiltersProps {
  filters: AdminMessageFilterState;
  onChange: (patch: Partial<AdminMessageFilterState>) => void;
}

export function AdminMessageFilters({ filters, onChange }: AdminMessageFiltersProps) {
  return (
    <AdminFilterBar
      title={ADMIN_MESSAGE_FILTER_LABELS.title}
      resetLabel={ADMIN_MESSAGE_FILTER_LABELS.resetLabel}
      onReset={() => onChange(DEFAULT_ADMIN_MESSAGE_FILTER_STATE)}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold text-muted-foreground">
          {ADMIN_MESSAGE_FILTER_LABELS.updatedWithin}
        </legend>
        <div className="flex flex-wrap gap-2">
          {ADMIN_MESSAGE_DATE_RANGE_OPTIONS.map((option) => {
            const isSelected = option.days === filters.updatedWithinDays;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ updatedWithinDays: option.days })}
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
