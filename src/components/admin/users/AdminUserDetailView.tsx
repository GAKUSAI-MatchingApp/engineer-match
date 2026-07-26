"use client";

import { useState } from "react";
import { AdminUserDetailHeader } from "@/components/admin/users/AdminUserDetailHeader";
import { AdminUserProfileSection } from "@/components/admin/users/AdminUserProfileSection";
import { AdminUserActivitySection } from "@/components/admin/users/AdminUserActivitySection";
import { AdminUserStatusDialog } from "@/components/admin/users/AdminUserStatusDialog";
import {
  ADMIN_USER_STATUS_ERROR_FALLBACK,
  ADMIN_USER_TOAST_MESSAGES,
} from "@/constants/admin-users";
import { updateUserStatus, type AdminUserDetail, type AdminUserStatus } from "@/lib/admin/users";
import { createClient } from "@/lib/supabase/client";

interface AdminUserDetailViewProps {
  user: AdminUserDetail;
  currentAdminId: string | null;
  activeAdminCount: number;
}

export function AdminUserDetailView({
  user: initialUser,
  currentAdminId,
  activeAdminCount,
}: AdminUserDetailViewProps) {
  const [status, setStatus] = useState<AdminUserStatus>(initialUser.status);
  const [dialogMode, setDialogMode] = useState<"suspend" | "reinstate" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const user = { ...initialUser, status };

  // RD-2026-001 BR-103/BR-104, UI-side mirror of the backend/DB guard in
  // updateUserStatus() and trg_users_admin_status_protection: hide the
  // suspend action instead of letting the admin hit the backend error. Not a
  // security boundary by itself -- the backend still rejects both cases
  // independently even if this check is bypassed.
  const isSelf = currentAdminId !== null && user.id === currentAdminId;
  const isSoleActiveAdmin =
    user.role === "ADMIN" && user.status === "ACTIVE" && activeAdminCount <= 1;
  const suspendDisabledReason = isSelf
    ? "自分自身のアカウントを停止することはできません。"
    : isSoleActiveAdmin
      ? "有効な管理者が1名のみのため、このアカウントを停止できません。"
      : null;

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  function closeDialog() {
    setDialogMode(null);
    setErrorMessage(null);
  }

  async function handleConfirmDialog() {
    if (!dialogMode) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase = createClient();
    const nextStatus: AdminUserStatus = dialogMode === "suspend" ? "SUSPENDED" : "ACTIVE";
    const { error } = await updateUserStatus(supabase, user.id, nextStatus);

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error || ADMIN_USER_STATUS_ERROR_FALLBACK);
      return;
    }

    setStatus(nextStatus);
    showToast(
      dialogMode === "suspend" ? ADMIN_USER_TOAST_MESSAGES.suspended : ADMIN_USER_TOAST_MESSAGES.reinstated,
    );
    setDialogMode(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminUserDetailHeader
        user={user}
        onSuspend={() => setDialogMode("suspend")}
        onReinstate={() => setDialogMode("reinstate")}
        suspendDisabledReason={suspendDisabledReason}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AdminUserProfileSection user={user} />
        </div>
        <div className="flex flex-col gap-6">
          <AdminUserActivitySection user={user} />
        </div>
      </div>

      <AdminUserStatusDialog
        mode={dialogMode}
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
