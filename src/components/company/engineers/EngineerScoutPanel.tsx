"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { ENGINEER_DETAIL_SCOUT_PANEL } from "@/constants/company-scouts";
import { createClient } from "@/lib/supabase/client";
import { sendScout, mapScoutError, type ScoutStatusInfo } from "@/lib/company/scouts";

const PANEL = ENGINEER_DETAIL_SCOUT_PANEL;
const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface EngineerScoutPanelProps {
  engineerId: string;
  initialStatus: ScoutStatusInfo | null;
  opportunities: { id: string; title: string }[];
}

/**
 * Review #24 本対応. Replaces the previously-disabled "メッセージを送る"
 * button on /company/engineers/[id] with a real scout-send flow. Sending a
 * scout never creates a chat_room directly -- that only happens once the
 * Engineer accepts (respond_to_scout RPC, run from their own side).
 */
export function EngineerScoutPanel({
  engineerId,
  initialStatus,
  opportunities,
}: EngineerScoutPanelProps) {
  const messageId = useId();
  const opportunityId = useId();

  const [status, setStatus] = useState<ScoutStatusInfo | null>(initialStatus);
  const [mode, setMode] = useState<"idle" | "form">("idle");
  const [message, setMessage] = useState("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<"error" | "success" | null>(null);

  function openForm() {
    setMode("form");
    setMessage("");
    setSelectedOpportunityId("");
    setFormMessage(null);
    setFormStatus(null);
  }

  function cancelForm() {
    setMode("idle");
    setFormMessage(null);
    setFormStatus(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setFormMessage(null);
    setFormStatus(null);

    const trimmed = message.trim();
    if (!trimmed) {
      setFormMessage(PANEL.validation.messageRequired);
      setFormStatus("error");
      return;
    }
    if (trimmed.length > 2000) {
      setFormMessage(PANEL.validation.messageTooLong);
      setFormStatus("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await sendScout(supabase, {
        engineerId,
        message: trimmed,
        opportunityId: selectedOpportunityId || null,
      });

      if (error || !data) {
        console.error("[company-scouts] send failed:", error);
        setFormMessage(mapScoutError(error));
        setFormStatus("error");
        return;
      }

      setStatus({
        id: data.id,
        status: "pending",
        message: trimmed,
        createdAt: new Date().toISOString(),
        respondedAt: null,
        chatRoomId: null,
      });
      setMode("idle");
    } catch (err) {
      console.error("[company-scouts] unexpected send error:", err);
      setFormMessage(PANEL.errorGeneric);
      setFormStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status?.status === "pending") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            {PANEL.status.pendingLabel}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{PANEL.status.pendingDescription}</p>
      </div>
    );
  }

  if (status?.status === "accepted" && status.chatRoomId) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {PANEL.status.acceptedLabel}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{PANEL.status.acceptedDescription}</p>
        <Link
          href={`/company/messages/scout/${status.id}`}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {PANEL.status.chatButtonLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      {status?.status === "declined" && mode === "idle" && (
        <div className="mb-4">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            {PANEL.status.declinedLabel}
          </span>
          <p className="mt-3 text-xs text-muted-foreground">{PANEL.status.declinedDescription}</p>
        </div>
      )}

      {mode === "idle" ? (
        <button
          type="button"
          onClick={openForm}
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {status?.status === "declined" ? PANEL.status.resendButtonLabel : PANEL.sendButtonLabel}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{PANEL.form.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{PANEL.form.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={messageId}>
              {PANEL.form.messageLabel}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id={messageId}
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 2000))}
              placeholder={PANEL.form.messagePlaceholder}
              maxLength={2000}
              rows={5}
              disabled={isSubmitting}
              required
            />
            <p className="text-right text-xs text-muted-foreground">{message.length} / 2000</p>
          </div>

          {opportunities.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={opportunityId}>{PANEL.form.opportunityLabel}</Label>
              <select
                id={opportunityId}
                value={selectedOpportunityId}
                onChange={(event) => setSelectedOpportunityId(event.target.value)}
                className={SELECT_CLASS}
                disabled={isSubmitting}
              >
                <option value="">{PANEL.form.opportunityPlaceholder}</option>
                {opportunities.map((opportunity) => (
                  <option key={opportunity.id} value={opportunity.id}>
                    {opportunity.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <FormStatusMessage message={formMessage} status={formStatus} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? PANEL.form.submittingLabel : PANEL.form.submitLabel}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {PANEL.cancelLabel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
