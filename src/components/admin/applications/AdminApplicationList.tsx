"use client";

import { useMemo, useState } from "react";
import { AdminApplicationSummaryCards } from "@/components/admin/applications/AdminApplicationSummaryCards";
import { AdminApplicationToolbar } from "@/components/admin/applications/AdminApplicationToolbar";
import { AdminApplicationFilters } from "@/components/admin/applications/AdminApplicationFilters";
import { AdminApplicationTable } from "@/components/admin/applications/AdminApplicationTable";
import { AdminApplicationMobileCards } from "@/components/admin/applications/AdminApplicationMobileCards";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminPagination } from "@/components/admin/shared/AdminPagination";
import {
  ADMIN_APPLICATION_RESULTS_META,
  DEFAULT_ADMIN_APPLICATION_FILTER_STATE,
  type AdminApplicationFilterState,
} from "@/constants/admin-applications";
import type { AdminApplicationListItem } from "@/lib/admin/applications";

const PAGE_SIZE = 8;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

interface AdminApplicationListProps {
  initialApplications: AdminApplicationListItem[];
}

export function AdminApplicationList({ initialApplications }: AdminApplicationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<AdminApplicationFilterState>(
    DEFAULT_ADMIN_APPLICATION_FILTER_STATE,
  );
  const [currentPage, setCurrentPage] = useState(1);

  function handleFilterChange(patch: Partial<AdminApplicationFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setCurrentPage(1);
  }

  function handleResetAll() {
    setSearchQuery("");
    setFilters(DEFAULT_ADMIN_APPLICATION_FILTER_STATE);
    setCurrentPage(1);
  }

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initialApplications.filter((app) => {
      if (query) {
        const haystack =
          `${app.applicantName} ${app.companyName} ${app.opportunityTitle} ${app.id}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) return false;
      if (filters.contractTypes.length > 0 && !filters.contractTypes.includes(app.contractType)) {
        return false;
      }
      if (
        filters.appliedWithinDays !== null &&
        daysSince(app.appliedAtISO) > filters.appliedWithinDays
      ) {
        return false;
      }
      return true;
    });
  }, [initialApplications, searchQuery, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const pagedApplications = filteredApplications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminApplicationSummaryCards applications={initialApplications} />
      <AdminApplicationToolbar
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
      />
      <AdminApplicationFilters filters={filters} onChange={handleFilterChange} />

      <p className="text-sm text-muted-foreground">
        {filteredApplications.length}
        {ADMIN_APPLICATION_RESULTS_META.resultsSuffix}
      </p>

      {filteredApplications.length === 0 ? (
        <AdminEmptyState
          title="条件に一致する応募が見つかりませんでした。"
          description="検索キーワードや絞り込み条件を変更してお試しください。"
          action={{ label: "条件をリセット", onClick: handleResetAll }}
        />
      ) : (
        <>
          <AdminApplicationTable applications={pagedApplications} />
          <AdminApplicationMobileCards applications={pagedApplications} />
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
    </div>
  );
}
