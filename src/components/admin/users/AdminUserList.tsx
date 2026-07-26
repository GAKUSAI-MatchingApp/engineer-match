"use client";

import { useMemo, useState } from "react";
import { AdminUserSummaryCards } from "@/components/admin/users/AdminUserSummaryCards";
import { AdminUserToolbar } from "@/components/admin/users/AdminUserToolbar";
import { AdminUserFilters } from "@/components/admin/users/AdminUserFilters";
import { AdminUserTable } from "@/components/admin/users/AdminUserTable";
import { AdminUserMobileCards } from "@/components/admin/users/AdminUserMobileCards";
import { AdminUserStatusDialog } from "@/components/admin/users/AdminUserStatusDialog";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import { AdminPagination } from "@/components/admin/shared/AdminPagination";
import {
  ADMIN_USER_RESULTS_META,
  ADMIN_USER_STATUS_ERROR_FALLBACK,
  ADMIN_USER_TOAST_MESSAGES,
  DEFAULT_ADMIN_USER_FILTER_STATE,
  type AdminUserFilterState,
} from "@/constants/admin-users";
import { updateUserStatus, type AdminUserListItem } from "@/lib/admin/users";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 8;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

interface AdminUserListProps {
  initialUsers: AdminUserListItem[];
  currentAdminId: string | null;
}

type DialogState = { mode: "suspend" | "reinstate"; userId: string } | null;

export function AdminUserList({ initialUsers, currentAdminId }: AdminUserListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<AdminUserFilterState>(DEFAULT_ADMIN_USER_FILTER_STATE);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  function handleFilterChange(patch: Partial<AdminUserFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setCurrentPage(1);
  }

  function handleResetAll() {
    setSearchQuery("");
    setFilters(DEFAULT_ADMIN_USER_FILTER_STATE);
    setCurrentPage(1);
  }

  function closeDialog() {
    setDialog(null);
    setErrorMessage(null);
  }

  async function handleConfirmDialog() {
    if (!dialog) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase = createClient();
    const nextStatus = dialog.mode === "suspend" ? "SUSPENDED" : "ACTIVE";
    const { error } = await updateUserStatus(supabase, dialog.userId, nextStatus);

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error || ADMIN_USER_STATUS_ERROR_FALLBACK);
      return;
    }

    setUsers((prev) =>
      prev.map((user) => (user.id === dialog.userId ? { ...user, status: nextStatus } : user)),
    );
    showToast(
      dialog.mode === "suspend" ? ADMIN_USER_TOAST_MESSAGES.suspended : ADMIN_USER_TOAST_MESSAGES.reinstated,
    );
    setDialog(null);
  }

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (query) {
        const haystack = `${user.name} ${user.email} ${user.id} ${user.companyName ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.roles.length > 0 && !filters.roles.includes(user.role)) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(user.status)) return false;
      if (
        filters.registeredWithinDays !== null &&
        daysSince(user.createdAtISO) > filters.registeredWithinDays
      ) {
        return false;
      }
      return true;
    });
  }, [users, searchQuery, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // RD-2026-001 BR-103/BR-104, UI-side mirror of the backend/DB guard in
  // updateUserStatus() and trg_users_admin_status_protection. Derived from
  // the same users list already loaded here, no extra query needed.
  const activeAdminCount = users.filter(
    (u) => u.role === "ADMIN" && u.status === "ACTIVE",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminUserSummaryCards users={users} />
      <AdminUserToolbar
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
      />
      <AdminUserFilters filters={filters} onChange={handleFilterChange} />

      <p className="text-sm text-muted-foreground">
        {filteredUsers.length}
        {ADMIN_USER_RESULTS_META.resultsSuffix}
      </p>

      {filteredUsers.length === 0 ? (
        <AdminEmptyState
          title="条件に一致するユーザーが見つかりませんでした。"
          description="検索キーワードや絞り込み条件を変更してお試しください。"
          action={{ label: "条件をリセット", onClick: handleResetAll }}
        />
      ) : (
        <>
          <AdminUserTable
            users={pagedUsers}
            currentAdminId={currentAdminId}
            activeAdminCount={activeAdminCount}
            onSuspend={(id) => setDialog({ mode: "suspend", userId: id })}
            onReinstate={(id) => setDialog({ mode: "reinstate", userId: id })}
          />
          <AdminUserMobileCards
            users={pagedUsers}
            currentAdminId={currentAdminId}
            activeAdminCount={activeAdminCount}
            onSuspend={(id) => setDialog({ mode: "suspend", userId: id })}
            onReinstate={(id) => setDialog({ mode: "reinstate", userId: id })}
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

      <AdminUserStatusDialog
        mode={dialog?.mode ?? null}
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
