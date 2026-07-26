"use client";

import { useMemo, useState } from "react";
import { AdminMessageSummaryCards } from "@/components/admin/messages/AdminMessageSummaryCards";
import { AdminMessageToolbar } from "@/components/admin/messages/AdminMessageToolbar";
import { AdminMessageFilters } from "@/components/admin/messages/AdminMessageFilters";
import { AdminMessageTable } from "@/components/admin/messages/AdminMessageTable";
import { AdminMessageMobileCards } from "@/components/admin/messages/AdminMessageMobileCards";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminPagination } from "@/components/admin/shared/AdminPagination";
import {
  ADMIN_MESSAGE_RESULTS_META,
  DEFAULT_ADMIN_MESSAGE_FILTER_STATE,
  type AdminMessageFilterState,
} from "@/constants/admin-messages";
import type { AdminConversationListItem } from "@/lib/admin/messages";

const PAGE_SIZE = 8;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

interface AdminMessageListProps {
  conversations: AdminConversationListItem[];
}

export function AdminMessageList({ conversations }: AdminMessageListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<AdminMessageFilterState>(DEFAULT_ADMIN_MESSAGE_FILTER_STATE);
  const [currentPage, setCurrentPage] = useState(1);

  function handleFilterChange(patch: Partial<AdminMessageFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setCurrentPage(1);
  }

  function handleResetAll() {
    setSearchQuery("");
    setFilters(DEFAULT_ADMIN_MESSAGE_FILTER_STATE);
    setCurrentPage(1);
  }

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conversations.filter((c) => {
      if (query) {
        const haystack = `${c.engineerName} ${c.companyName} ${c.opportunityTitle}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.updatedWithinDays !== null && daysSince(c.updatedAtISO) > filters.updatedWithinDays) {
        return false;
      }
      return true;
    });
  }, [conversations, searchQuery, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredConversations.length / PAGE_SIZE));
  const pagedConversations = filteredConversations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminMessageSummaryCards conversations={conversations} />
      <AdminMessageToolbar
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
      />
      <AdminMessageFilters filters={filters} onChange={handleFilterChange} />

      <p className="text-sm text-muted-foreground">
        {filteredConversations.length}
        {ADMIN_MESSAGE_RESULTS_META.resultsSuffix}
      </p>

      {filteredConversations.length === 0 ? (
        <AdminEmptyState
          title="条件に一致する会話が見つかりませんでした。"
          description="検索キーワードや絞り込み条件を変更してお試しください。"
          action={{ label: "条件をリセット", onClick: handleResetAll }}
        />
      ) : (
        <>
          <AdminMessageTable conversations={pagedConversations} />
          <AdminMessageMobileCards conversations={pagedConversations} />
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
