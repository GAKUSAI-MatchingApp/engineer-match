"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminDetailSection } from "@/components/admin/shared/AdminDetailSection";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import {
  ADMIN_REPORT_STATUS_FORM_LABELS as LABELS,
  ADMIN_REPORT_STATUS_LABEL,
  ADMIN_REPORT_STATUS_OPTIONS,
} from "@/constants/admin-reports";
import { updateReportStatus, type AdminReportDetail, type AdminReportStatus } from "@/lib/admin/reports";
import { createClient } from "@/lib/supabase/client";

interface AdminReportStatusFormProps {
  report: AdminReportDetail;
  onUpdated: (status: AdminReportStatus, adminNote: string | null, handledAtLabel: string) => void;
}

const SELECT_CLASS =
  "h-10 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary";

export function AdminReportStatusForm({ report, onUpdated }: AdminReportStatusFormProps) {
  const [status, setStatus] = useState<AdminReportStatus>(report.status);
  const [note, setNote] = useState(report.adminNote ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await updateReportStatus(supabase, report.id, status, note);

    setIsSubmitting(false);

    if (error) {
      setMessage({ tone: "error", text: error || LABELS.errorFallback });
      return;
    }

    setMessage({ tone: "success", text: LABELS.successMessage });
    onUpdated(status, note.trim() ? note.trim() : null, "たった今");
  }

  return (
    <AdminDetailSection title={LABELS.title} description={LABELS.description}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="report-status-select" className="text-sm font-medium text-foreground">
            {LABELS.statusLabel}
          </label>
          <select
            id="report-status-select"
            value={status}
            onChange={(event) => setStatus(event.target.value as AdminReportStatus)}
            className={SELECT_CLASS}
          >
            {ADMIN_REPORT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {ADMIN_REPORT_STATUS_LABEL[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="report-admin-note" className="text-sm font-medium text-foreground">
            {LABELS.noteLabel}
          </label>
          <textarea
            id="report-admin-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={LABELS.notePlaceholder}
            rows={4}
            maxLength={2000}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <FormStatusMessage message={message?.text ?? null} status={message?.tone ?? null} />

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="inline-flex h-10 w-fit items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {LABELS.submitLabel}
        </button>
      </form>
    </AdminDetailSection>
  );
}
