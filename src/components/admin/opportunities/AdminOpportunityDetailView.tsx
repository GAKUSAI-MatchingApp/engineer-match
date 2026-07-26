"use client";

import { useState } from "react";
import { AdminOpportunityDetailHeader } from "@/components/admin/opportunities/AdminOpportunityDetailHeader";
import { AdminOpportunityOverview } from "@/components/admin/opportunities/AdminOpportunityOverview";
import { AdminOpportunityHistorySection } from "@/components/admin/opportunities/AdminOpportunityHistorySection";
import { AdminOpportunityStatusDialog } from "@/components/admin/opportunities/AdminOpportunityStatusDialog";
import {
  ADMIN_OPPORTUNITY_MODERATION_ERROR_FALLBACK,
  ADMIN_OPPORTUNITY_TOAST_MESSAGES,
} from "@/constants/admin-opportunities";
import {
  updateOpportunityModeration,
  type AdminOpportunityDetail,
  type AdminOpportunityModerationAction,
  type AdminOpportunityStatus,
} from "@/lib/admin/opportunities";
import { createClient } from "@/lib/supabase/client";

interface AdminOpportunityDetailViewProps {
  opportunity: AdminOpportunityDetail;
}

export function AdminOpportunityDetailView({ opportunity: initial }: AdminOpportunityDetailViewProps) {
  const [status, setStatus] = useState<AdminOpportunityStatus>(initial.status);
  const [unpublishedByAdmin, setUnpublishedByAdmin] = useState(initial.unpublishedByAdmin);
  const [dialogAction, setDialogAction] = useState<AdminOpportunityModerationAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const opportunity = { ...initial, status, unpublishedByAdmin };

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  function closeDialog() {
    setDialogAction(null);
    setErrorMessage(null);
  }

  async function handleConfirmDialog(reason: string) {
    if (!dialogAction) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await updateOpportunityModeration(
      supabase,
      opportunity.id,
      dialogAction,
      reason,
    );

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error || ADMIN_OPPORTUNITY_MODERATION_ERROR_FALLBACK);
      return;
    }

    if (dialogAction === "takedown") setUnpublishedByAdmin(true);
    else if (dialogAction === "republish") setUnpublishedByAdmin(false);
    else setStatus("closed");

    showToast(ADMIN_OPPORTUNITY_TOAST_MESSAGES[dialogAction]);
    setDialogAction(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminOpportunityDetailHeader opportunity={opportunity} onAction={setDialogAction} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AdminOpportunityOverview opportunity={opportunity} />
        </div>
        <div className="flex flex-col gap-6">
          <AdminOpportunityHistorySection opportunity={opportunity} />
        </div>
      </div>

      <AdminOpportunityStatusDialog
        key={dialogAction ?? "closed"}
        mode={dialogAction}
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
