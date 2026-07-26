"use client";

import { useMemo, useState } from "react";
import { AdminOpportunitySummaryCards } from "@/components/admin/opportunities/AdminOpportunitySummaryCards";
import { AdminOpportunityToolbar } from "@/components/admin/opportunities/AdminOpportunityToolbar";
import { AdminOpportunityFilters } from "@/components/admin/opportunities/AdminOpportunityFilters";
import { AdminOpportunityTable } from "@/components/admin/opportunities/AdminOpportunityTable";
import { AdminOpportunityMobileCards } from "@/components/admin/opportunities/AdminOpportunityMobileCards";
import { AdminOpportunityStatusDialog } from "@/components/admin/opportunities/AdminOpportunityStatusDialog";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminPagination } from "@/components/admin/shared/AdminPagination";
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

const PAGE_SIZE = 8;

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
  const [currentPage, setCurrentPage] = useState(1);
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
    setCurrentPage(1);
  }

  function handleResetAll() {
    setSearchQuery("");
    setFilters(DEFAULT_ADMIN_OPPORTUNITY_FILTER_STATE);
    setCurrentPage(1);
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
      if (
        filters.postedWithinDays !== null &&
        daysSince(opp.createdAtISO) > filters.postedWithinDays
      ) {
        return false;
      }
      return true;
    });
  }, [opportunities, searchQuery, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredOpportunities.length / PAGE_SIZE));
  const pagedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminOpportunitySummaryCards opportunities={opportunities} />
      <AdminOpportunityToolbar
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
      />
      <AdminOpportunityFilters filters={filters} onChange={handleFilterChange} />

      <p className="text-sm text-muted-foreground">
        {filteredOpportunities.length}
        {ADMIN_OPPORTUNITY_RESULTS_META.resultsSuffix}
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
            opportunities={pagedOpportunities}
            onAction={(id, action) => setDialog({ action, opportunityId: id })}
          />
          <AdminOpportunityMobileCards
            opportunities={pagedOpportunities}
            onAction={(id, action) => setDialog({ action, opportunityId: id })}
          />
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            previousLabel="前へ"
            nextLabel="次へ"
            pageLabelPrefix="ページ"
          />
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
