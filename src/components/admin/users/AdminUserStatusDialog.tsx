"use client";

import { AdminConfirmDialog } from "@/components/admin/shared/AdminConfirmDialog";
import { ADMIN_USER_STATUS_DIALOG_LABELS } from "@/constants/admin-users";

interface AdminUserStatusDialogProps {
  mode: "suspend" | "reinstate" | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AdminUserStatusDialog({
  mode,
  isSubmitting,
  errorMessage,
  onCancel,
  onConfirm,
}: AdminUserStatusDialogProps) {
  const isSuspend = mode === "suspend";
  return (
    <AdminConfirmDialog
      isOpen={mode !== null}
      title={
        isSuspend
          ? ADMIN_USER_STATUS_DIALOG_LABELS.suspendTitle
          : ADMIN_USER_STATUS_DIALOG_LABELS.reinstateTitle
      }
      description={
        isSuspend
          ? ADMIN_USER_STATUS_DIALOG_LABELS.suspendDescription
          : ADMIN_USER_STATUS_DIALOG_LABELS.reinstateDescription
      }
      confirmLabel={
        isSuspend
          ? ADMIN_USER_STATUS_DIALOG_LABELS.suspendConfirmLabel
          : ADMIN_USER_STATUS_DIALOG_LABELS.reinstateConfirmLabel
      }
      tone={isSuspend ? "danger" : "primary"}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
