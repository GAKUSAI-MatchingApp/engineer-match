"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Loader2, ShieldX, Workflow } from "lucide-react";
import { StatusChangeDialog } from "@/components/company/applicants/StatusChangeDialog";
import { RejectDialog } from "@/components/company/applicants/RejectDialog";
import {
  APPLICANT_DETAIL_META,
  APPLICATION_STATUS_BADGE_STYLES,
  APPLICATION_STATUS_LABELS,
  STATUS_ACTION_LABELS,
} from "@/constants/company-applicants";
import {
  COMPANY_REJECTABLE_STATUSES,
  STATUS_NEXT_STEP,
  updateApplicationStatus,
  type ApplicationStatus,
} from "@/lib/company/applicants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ApplicantStatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function ApplicantStatusBadge({ status, className }: ApplicantStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        APPLICATION_STATUS_BADGE_STYLES[status],
        className,
      )}
    >
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Shares the real (Supabase-persisted) applicant status between the hero
 * badge and the status-change / reject actions elsewhere on the detail page.
 * Every transition here calls updateApplicationStatus() — nothing is
 * client-only or unpersisted, unlike the earlier mock version of this file.
 */
const ApplicantStatusContext = createContext<{
  applicationId: string;
  status: ApplicationStatus;
  isSubmitting: boolean;
  message: { tone: "success" | "error"; text: string } | null;
  changeStatus: (next: ApplicationStatus) => Promise<void>;
} | null>(null);

export function useApplicantStatusContext() {
  const context = useContext(ApplicantStatusContext);
  if (!context) {
    throw new Error(
      "This component must be rendered within ApplicantStatusProvider.",
    );
  }
  return context;
}

interface ApplicantStatusProviderProps {
  applicationId: string;
  initialStatus: ApplicationStatus;
  children: ReactNode;
}

export function ApplicantStatusProvider({
  applicationId,
  initialStatus,
  children,
}: ApplicantStatusProviderProps) {
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  async function changeStatus(next: ApplicationStatus) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await updateApplicationStatus(supabase, applicationId, status, next);

    setIsSubmitting(false);

    if (error) {
      console.error("[company-applicants] status update failed:", error);
      setMessage({ tone: "error", text: STATUS_ACTION_LABELS.updateError });
      return;
    }

    setStatus(next);
    setMessage({ tone: "success", text: STATUS_ACTION_LABELS.updateSuccess });
  }

  return (
    <ApplicantStatusContext.Provider
      value={{ applicationId, status, isSubmitting, message, changeStatus }}
    >
      {children}
    </ApplicantStatusContext.Provider>
  );
}

export function LiveApplicantStatusBadge() {
  const { status } = useApplicantStatusContext();
  return <ApplicantStatusBadge status={status} />;
}

export function ApplicantStatusActions() {
  const { status, isSubmitting, message, changeStatus } = useApplicantStatusContext();
  const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const nextStatus = STATUS_NEXT_STEP[status];
  const canReject = COMPANY_REJECTABLE_STATUSES.includes(status);
  // accepted -> completed reuses the same generic change-status flow, but
  // "次の選考段階に進める" (advance to next screening stage) reads oddly for
  // marking already-hired work as finished -- this is the one label swap
  // needed to keep the reused StatusChangeDialog flow accurate here.
  const changeButtonLabel =
    nextStatus === "completed" ? "この案件を完了にする" : APPLICANT_DETAIL_META.changeStatusLabel;

  async function handleConfirmChange() {
    if (!nextStatus) return;
    await changeStatus(nextStatus);
    setIsChangeDialogOpen(false);
  }

  async function handleConfirmReject() {
    await changeStatus("rejected");
    setIsRejectDialogOpen(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {nextStatus && (
          <button
            type="button"
            onClick={() => setIsChangeDialogOpen(true)}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Workflow className="h-4 w-4" aria-hidden="true" />
            {changeButtonLabel}
          </button>
        )}
        {canReject && (
          <button
            type="button"
            onClick={() => setIsRejectDialogOpen(true)}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldX className="h-4 w-4" aria-hidden="true" />
            {APPLICANT_DETAIL_META.rejectLabel}
          </button>
        )}
      </div>

      {isSubmitting && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          {STATUS_ACTION_LABELS.updating}
        </span>
      )}

      {nextStatus && (
        <StatusChangeDialog
          isOpen={isChangeDialogOpen}
          currentStatus={status}
          nextStatus={nextStatus}
          isSubmitting={isSubmitting}
          onCancel={() => setIsChangeDialogOpen(false)}
          onConfirm={handleConfirmChange}
        />
      )}

      <RejectDialog
        isOpen={isRejectDialogOpen}
        isSubmitting={isSubmitting}
        onCancel={() => setIsRejectDialogOpen(false)}
        onConfirm={handleConfirmReject}
      />

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:justify-end sm:pr-6"
        >
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
              message.tone === "success"
                ? "bg-foreground text-white"
                : "bg-red-600 text-white",
            )}
          >
            {message.text}
          </div>
        </div>
      )}
    </div>
  );
}
