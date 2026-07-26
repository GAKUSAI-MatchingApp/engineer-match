"use client";

import { useMemo, useState } from "react";
import { AdminCompanySummaryCards } from "@/components/admin/companies/AdminCompanySummaryCards";
import { AdminCompanyToolbar } from "@/components/admin/companies/AdminCompanyToolbar";
import { AdminCompanyFilters } from "@/components/admin/companies/AdminCompanyFilters";
import { AdminCompanyTable } from "@/components/admin/companies/AdminCompanyTable";
import { AdminCompanyMobileCards } from "@/components/admin/companies/AdminCompanyMobileCards";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminPagination } from "@/components/admin/shared/AdminPagination";
import {
  ADMIN_COMPANY_RESULTS_META,
  DEFAULT_ADMIN_COMPANY_FILTER_STATE,
  type AdminCompanyFilterState,
} from "@/constants/admin-companies";
import type { AdminCompanyListItem } from "@/lib/admin/companies";

const PAGE_SIZE = 8;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

interface AdminCompanyListProps {
  initialCompanies: AdminCompanyListItem[];
}

export function AdminCompanyList({ initialCompanies }: AdminCompanyListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<AdminCompanyFilterState>(DEFAULT_ADMIN_COMPANY_FILTER_STATE);
  const [currentPage, setCurrentPage] = useState(1);

  const availableIndustries = useMemo(
    () => [...new Set(initialCompanies.map((c) => c.industry).filter((v): v is string => Boolean(v)))],
    [initialCompanies],
  );

  function handleFilterChange(patch: Partial<AdminCompanyFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setCurrentPage(1);
  }

  function handleResetAll() {
    setSearchQuery("");
    setFilters(DEFAULT_ADMIN_COMPANY_FILTER_STATE);
    setCurrentPage(1);
  }

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initialCompanies.filter((company) => {
      if (query) {
        const haystack = `${company.name} ${company.contactName ?? ""} ${company.id}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.usageStatuses.length > 0 && !filters.usageStatuses.includes(company.usageStatus)) {
        return false;
      }
      if (filters.industries.length > 0 && (!company.industry || !filters.industries.includes(company.industry))) {
        return false;
      }
      if (
        filters.companySizes.length > 0 &&
        (!company.companySize || !filters.companySizes.includes(company.companySize))
      ) {
        return false;
      }
      if (
        filters.registeredWithinDays !== null &&
        daysSince(company.createdAtISO) > filters.registeredWithinDays
      ) {
        return false;
      }
      return true;
    });
  }, [initialCompanies, searchQuery, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
  const pagedCompanies = filteredCompanies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminCompanySummaryCards companies={initialCompanies} />
      <AdminCompanyToolbar
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
      />
      <AdminCompanyFilters
        filters={filters}
        onChange={handleFilterChange}
        availableIndustries={availableIndustries}
      />

      <p className="text-sm text-muted-foreground">
        {filteredCompanies.length}
        {ADMIN_COMPANY_RESULTS_META.resultsSuffix}
      </p>

      {filteredCompanies.length === 0 ? (
        <AdminEmptyState
          title="条件に一致する企業が見つかりませんでした。"
          description="検索キーワードや絞り込み条件を変更してお試しください。"
          action={{ label: "条件をリセット", onClick: handleResetAll }}
        />
      ) : (
        <>
          <AdminCompanyTable companies={pagedCompanies} />
          <AdminCompanyMobileCards companies={pagedCompanies} />
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
