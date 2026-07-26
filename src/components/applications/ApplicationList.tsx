"use client";

import { useMemo, useState } from "react";
import { Award, CheckCircle2, MessagesSquare, RotateCcw, Search, Send } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Input } from "@/components/ui/input";
import { ApplicationCard } from "@/components/applications/ApplicationCard";
import { ApplicationEmptyState } from "@/components/applications/ApplicationEmptyState";
import {
  APPLICATION_LIST_META,
  APPLICATION_STATUS_OPTIONS,
  EMPTY_STATE_LABELS,
  FILTERED_EMPTY_STATE_LABELS,
  FILTER_LABELS,
  SORT_OPTIONS,
  SUMMARY_CARDS,
  WITHDRAW_DIALOG_LABELS,
  type SortOption,
} from "@/constants/applications";
import { withdrawApplication } from "@/lib/engineer/applications";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationListItem } from "@/lib/engineer/applications";

const SUMMARY_ICON_MAP = {
  send: Send,
  messagesSquare: MessagesSquare,
  award: Award,
  checkCircle2: CheckCircle2,
} as const;

const SELECT_CLASSNAME =
  "h-11 w-full min-w-0 max-w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none";

interface ApplicationListProps {
  applications: ApplicationListItem[];
}

export function ApplicationList({ applications: initialApplications }: ApplicationListProps) {
  const [applications, setApplications] = useState<ApplicationListItem[]>(initialApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  async function handleWithdraw(id: string) {
    const current = applications.find((item) => item.id === id);
    if (!current) return;

    const supabase = createClient();
    const { data, error } = await withdrawApplication(supabase, id, current.status);

    if (error || !data) {
      console.error("[application-list] withdraw failed:", error);
      showToast(WITHDRAW_DIALOG_LABELS.errorMessage);
      return;
    }

    setApplications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "withdrawn" } : item)),
    );
    showToast(WITHDRAW_DIALOG_LABELS.toastMessage);
  }

  function handleResetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
  }

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all";

  const visibleApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = applications.filter((item) => {
      if (query && !item.opportunityTitle.toLowerCase().includes(query)) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const diff = a.applied_at.localeCompare(b.applied_at);
      return sortOption === "newest" ? -diff : diff;
    });

    return sorted;
  }, [applications, searchQuery, statusFilter, sortOption]);

  const summaryCounts = useMemo(() => {
    return SUMMARY_CARDS.map((card) => ({
      ...card,
      value: applications.filter((item) => (card.statuses as readonly string[]).includes(item.status))
        .length,
    }));
  }, [applications]);

  if (applications.length === 0) {
    return (
      <ApplicationEmptyState
        title={EMPTY_STATE_LABELS.title}
        description={EMPTY_STATE_LABELS.description}
        ctaLabel={EMPTY_STATE_LABELS.ctaLabel}
        ctaHref={EMPTY_STATE_LABELS.ctaHref}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCounts.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={String(card.value)}
            icon={SUMMARY_ICON_MAP[card.icon as keyof typeof SUMMARY_ICON_MAP]}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="min-w-[220px] flex-1">
            <label
              htmlFor="application-search-input"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              {FILTER_LABELS.searchLabel}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="application-search-input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={FILTER_LABELS.searchPlaceholder}
                className="h-11 pl-9"
              />
            </div>
          </div>

          <div className="w-full shrink-0 sm:w-44">
            <label
              htmlFor="application-status-filter"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              {FILTER_LABELS.statusLabel}
            </label>
            <select
              id="application-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={SELECT_CLASSNAME}
            >
              <option value="all">{FILTER_LABELS.statusAllLabel}</option>
              {APPLICATION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full shrink-0 sm:w-36">
            <label
              htmlFor="application-sort"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              {FILTER_LABELS.sortLabel}
            </label>
            <select
              id="application-sort"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              className={SELECT_CLASSNAME}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {FILTER_LABELS.resetLabel}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {visibleApplications.length}
        {APPLICATION_LIST_META.resultsSuffix}
      </p>

      {visibleApplications.length === 0 ? (
        <ApplicationEmptyState
          title={FILTERED_EMPTY_STATE_LABELS.title}
          description={FILTERED_EMPTY_STATE_LABELS.description}
          ctaLabel={FILTERED_EMPTY_STATE_LABELS.ctaLabel}
          onReset={handleResetFilters}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {visibleApplications.map((application) => (
            <li key={application.id}>
              <ApplicationCard application={application} onWithdraw={handleWithdraw} />
            </li>
          ))}
        </ul>
      )}

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
