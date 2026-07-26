"use client";

import { AdminConfirmDialog } from "@/components/admin/shared/AdminConfirmDialog";
import { ADMIN_OPPORTUNITY_MODERATION_DIALOG_LABELS as LABELS } from "@/constants/admin-opportunities";
import type { AdminOpportunityModerationAction } from "@/lib/admin/opportunities";

interface AdminOpportunityStatusDialogProps {
  mode: AdminOpportunityModerationAction | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const DIALOG_CONFIG = {
  takedown: {
    title: LABELS.takedownTitle,
    description: LABELS.takedownDescription,
    confirmLabel: LABELS.takedownConfirmLabel,
    tone: "danger" as const,
  },
  republish: {
    title: LABELS.republishTitle,
    description: LABELS.republishDescription,
    confirmLabel: LABELS.republishConfirmLabel,
    tone: "primary" as const,
  },
  close: {
    title: LABELS.closeTitle,
    description: LABELS.closeDescription,
    confirmLabel: LABELS.closeConfirmLabel,
    tone: "danger" as const,
  },
};

export function AdminOpportunityStatusDialog({
  mode,
  isSubmitting,
  errorMessage,
  onCancel,
  onConfirm,
}: AdminOpportunityStatusDialogProps) {
  const current = DIALOG_CONFIG[mode ?? "takedown"];
  return (
    <AdminConfirmDialog
      isOpen={mode !== null}
      title={current.title}
      description={current.description}
      confirmLabel={current.confirmLabel}
      tone={current.tone}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
