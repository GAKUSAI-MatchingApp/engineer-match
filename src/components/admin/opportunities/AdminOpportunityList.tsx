"use client";

import { useMemo, useState } from "react";
import { AdminOpportunitySummaryCards } from "@/components/admin/opportunities/AdminOpportunitySummaryCards";
import { AdminOpportunityToolbar } from "@/components/admin/opportunities/AdminOpportunityToolbar";
import { AdminOpportunityFilters } from "@/components/admin/opportunities/AdminOpportunityFilters";
import { AdminOpportunityTable } from "@/components/admin/opportunities/AdminOpportunityTable";
import { AdminOpportunityMobileCards } from "@/components/admin/opportunities/AdminOpportunityMobileCards";
import { AdminOpportunityStatusDialog } from "@/components/admin/opportunities/AdminOpportunityStatusDialog";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import {
  ADMIN_OPPORTUNITY_MODERATION_ERROR_FALLBACK,
  ADMIN_OPPORTUNITY_RESULTS_META,
  ADMIN_OPPORTUNITY_TOAST_MESSAGES,
  DEFAULT_ADMIN_OPPORTUNITY_FILTER_STATE,
  type AdminOpportunityFilterState,
} from "@/constants/admin-opportunities";
import {
  updateOpportunityModeration,
  type AdminOpportunityListItem,
  type AdminOpportunityModerationAction,
} from "@/lib/admin/opportunities";
import { createClient } from "@/lib/supabase/client";

const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_STEP = 12;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

interface AdminOpportunityListProps {
  initialOpportunities: AdminOpportunityListItem[];
}

type DialogState = { action: AdminOpportunityModerationAction; opportunityId: string } | null;

export function AdminOpportunityList({ initialOpportunities }: AdminOpportunityListProps) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<AdminOpportunityFilterState>(
    DEFAULT_ADMIN_OPPORTUNITY_FILTER_STATE,
  );
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  function handleFilterChange(patch: Partial<AdminOpportunityFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  function handleResetAll() {
    setSearchQuery("");
    setFilters(DEFAULT_ADMIN_OPPORTUNITY_FILTER_STATE);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  function closeDialog() {
    setDialog(null);
    setErrorMessage(null);
  }

  async function handleConfirmDialog(reason: string) {
    if (!dialog) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await updateOpportunityModeration(
      supabase,
      dialog.opportunityId,
      dialog.action,
      reason,
    );

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error || ADMIN_OPPORTUNITY_MODERATION_ERROR_FALLBACK);
      return;
    }

    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== dialog.opportunityId) return opp;
        if (dialog.action === "takedown") return { ...opp, unpublishedByAdmin: true };
        if (dialog.action === "republish") return { ...opp, unpublishedByAdmin: false };
        return { ...opp, status: "closed" as const };
      }),
    );
    showToast(ADMIN_OPPORTUNITY_TOAST_MESSAGES[dialog.action]);
    setDialog(null);
  }

  const filteredOpportunities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return opportunities.filter((opp) => {
      if (query) {
        const haystack = `${opp.title} ${opp.companyName} ${opp.id}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.contractTypes.length > 0 && !filters.contractTypes.includes(opp.contractType)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(opp.status)) {
        return false;
      }
      if (filters.reportStates.length === 1) {
        const hasReports = opp.reportCount > 0;
        if (filters.reportStates[0] === "reported" && !hasReports) return false;
        if (filters.reportStates[0] === "unreported" && hasReports) return false;
      }
      if (
        filters.postedWithinDays !== null &&
        daysSince(opp.createdAtISO) > filters.postedWithinDays
      ) {
        return false;
      }
      return true;
    });
  }, [opportunities, searchQuery, filters]);

  // Keep the Admin DOM compact while making every fetched result reachable.
  // Move filtering and cursor loading server-side if this dataset grows substantially.
  const visibleOpportunities = filteredOpportunities.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-6">
      <AdminOpportunitySummaryCards opportunities={opportunities} />
      <AdminOpportunityToolbar
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          setVisibleCount(INITIAL_VISIBLE_COUNT);
        }}
      />
      <AdminOpportunityFilters filters={filters} onChange={handleFilterChange} />

      <p className="text-sm text-muted-foreground">
        {filteredOpportunities.length}
        {ADMIN_OPPORTUNITY_RESULTS_META.resultsSuffix}
        {filteredOpportunities.length > 0 && (
          <span className="ml-2">
            （{ADMIN_OPPORTUNITY_RESULTS_META.visiblePrefix} {visibleOpportunities.length}件）
          </span>
        )}
      </p>

      {filteredOpportunities.length === 0 ? (
        <AdminEmptyState
          title="条件に一致する求人・案件が見つかりませんでした。"
          description="検索キーワードや絞り込み条件を変更してお試しください。"
          action={{ label: "条件をリセット", onClick: handleResetAll }}
        />
      ) : (
        <>
          <AdminOpportunityTable
            opportunities={visibleOpportunities}
            onAction={(id, action) => setDialog({ action, opportunityId: id })}
          />
          <AdminOpportunityMobileCards
            opportunities={visibleOpportunities}
            onAction={(id, action) => setDialog({ action, opportunityId: id })}
          />
          {visibleOpportunities.length < filteredOpportunities.length && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + LOAD_MORE_STEP)}
                className="inline-flex h-11 min-w-40 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {ADMIN_OPPORTUNITY_RESULTS_META.loadMore}
              </button>
            </div>
          )}
        </>
      )}

      <AdminOpportunityStatusDialog
        key={dialog?.action ?? "closed"}
        mode={dialog?.action ?? null}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onCancel={closeDialog}
        onConfirm={handleConfirmDialog}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:justify-end sm:pr-6"
        >
          <div className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-white shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
