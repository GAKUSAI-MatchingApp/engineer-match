"use client";

import { useId, useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/shared/AdminConfirmDialog";
import {
  ADMIN_OPPORTUNITY_MODERATION_DIALOG_LABELS as LABELS,
  ADMIN_OPPORTUNITY_TAKEDOWN_REASON as REASON_LABELS,
} from "@/constants/admin-opportunities";
import type { AdminOpportunityModerationAction } from "@/lib/admin/opportunities";

interface AdminOpportunityStatusDialogProps {
  mode: AdminOpportunityModerationAction | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  /** For "takedown", the trimmed, validated reason text; empty string otherwise. */
  onConfirm: (reason: string) => void;
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

/**
 * RD-2026-001 BR-91: takedown ("非公開にする") is the only moderation action
 * that requires a reason. The textarea only renders for that mode, and
 * confirmation is blocked client-side (trim non-empty, <=500 chars) before
 * onConfirm is even called -- the real enforcement is server-side in
 * updateOpportunityModeration (src/lib/admin/opportunities.ts), which
 * re-validates independently of this UI gate.
 *
 * The reason textarea's local state intentionally does NOT reset via a
 * mode-watching effect (that pattern cascades a synchronous re-render) --
 * callers must render this with `key={mode ?? "closed"}` so a genuinely new
 * dialog open remounts with fresh state, while a failed confirm for the
 * *same* open (mode unchanged, error shown) correctly keeps what the admin
 * already typed.
 */
export function AdminOpportunityStatusDialog({
  mode,
  isSubmitting,
  errorMessage,
  onCancel,
  onConfirm,
}: AdminOpportunityStatusDialogProps) {
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const current = DIALOG_CONFIG[mode ?? "takedown"];
  const isTakedown = mode === "takedown";
  const trimmedReason = reason.trim();
  const isReasonEmpty = trimmedReason.length === 0;
  const isReasonTooLong = trimmedReason.length > REASON_LABELS.maxLength;
  const showReasonError = isTakedown && touched && (isReasonEmpty || isReasonTooLong);

  function handleConfirm() {
    if (isTakedown) {
      setTouched(true);
      if (isReasonEmpty || isReasonTooLong) return;
    }
    onConfirm(isTakedown ? trimmedReason : "");
  }

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
      onConfirm={handleConfirm}
    >
      {isTakedown && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={reasonId} className="text-sm font-medium text-foreground">
            {REASON_LABELS.label}
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={REASON_LABELS.placeholder}
            rows={3}
            maxLength={REASON_LABELS.maxLength}
            aria-invalid={showReasonError}
            className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <div className="flex items-center justify-between text-xs">
            <span className={showReasonError ? "text-red-600" : "text-muted-foreground"}>
              {showReasonError
                ? isReasonEmpty
                  ? REASON_LABELS.requiredError
                  : REASON_LABELS.tooLongError
                : REASON_LABELS.helperText}
            </span>
            <span className="text-muted-foreground">
              {trimmedReason.length}/{REASON_LABELS.maxLength}
            </span>
          </div>
        </div>
      )}
    </AdminConfirmDialog>
  );
}
