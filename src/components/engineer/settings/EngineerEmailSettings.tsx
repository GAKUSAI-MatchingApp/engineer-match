"use client";

import { useId, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormStatusMessage, type FormMessageStatus } from "@/components/ui/FormStatusMessage";
import { ENGINEER_EMAIL_SETTINGS } from "@/constants/engineer-settings";
import { createClient } from "@/lib/supabase/client";
import { mapEmailChangeError } from "@/lib/auth/email-change";

type ViewMode = "view" | "change" | "sent";

interface EngineerEmailSettingsProps {
  /** Current confirmed auth.users.email, server-rendered -- never stale by more than one page load. */
  email: string;
  /** Whether this account can reauthenticate with a password (has an "email" identity/provider). */
  isPasswordUser: boolean;
  /** Seeded from /auth/email-change/callback's redirect query params. */
  initialNotice?: { status: FormMessageStatus; message: string } | null;
}

const FORM = ENGINEER_EMAIL_SETTINGS.form;
const VALIDATION = ENGINEER_EMAIL_SETTINGS.validation;

/**
 * Review #22 本対応. Email change flows entirely through Supabase Auth
 * (supabase.auth.updateUser({ email })) -- this component never writes to
 * public.users.email or auth.users directly. See
 * 081_public_users_email_sync_and_protection.sql for how public.users.email
 * catches up once GoTrue confirms the change.
 */
export function EngineerEmailSettings({
  email,
  isPasswordUser,
  initialNotice = null,
}: EngineerEmailSettingsProps) {
  const newEmailId = useId();
  const currentPasswordId = useId();

  const [mode, setMode] = useState<ViewMode>("view");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(initialNotice?.message ?? null);
  const [status, setStatus] = useState<FormMessageStatus>(initialNotice?.status ?? null);

  function openChangeForm() {
    setMode("change");
    setNewEmail("");
    setCurrentPassword("");
    setMessage(null);
    setStatus(null);
  }

  function cancelChangeForm() {
    setMode("view");
    setNewEmail("");
    setCurrentPassword("");
    setMessage(null);
    setStatus(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setMessage(null);
    setStatus(null);

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setMessage(VALIDATION.newEmailRequired);
      setStatus("error");
      return;
    }
    // Format validation is delegated to the <input type="email" required>
    // itself (native browser check) plus Supabase's own server-side
    // validation surfaced via mapEmailChangeError -- no bespoke email regex.
    if (trimmedEmail.toLowerCase() === email.toLowerCase()) {
      setMessage(VALIDATION.newEmailSameAsCurrent);
      setStatus("error");
      return;
    }
    if (isPasswordUser && !currentPassword) {
      setMessage(VALIDATION.currentPasswordRequired);
      setStatus("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      if (isPasswordUser) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        if (reauthError) {
          setMessage(mapEmailChangeError(reauthError));
          setStatus("error");
          return;
        }
      }

      const { error } = await supabase.auth.updateUser(
        { email: trimmedEmail },
        { emailRedirectTo: `${window.location.origin}/auth/email-change/callback` },
      );

      if (error) {
        console.error("[engineer-settings] email change request failed:", error);
        setMessage(mapEmailChangeError(error));
        setStatus("error");
        return;
      }

      setSubmittedEmail(trimmedEmail);
      setCurrentPassword("");
      setMode("sent");
    } catch (err) {
      console.error("[engineer-settings] unexpected email change error:", err);
      setMessage(ENGINEER_EMAIL_SETTINGS.errorGeneric);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (isResending) return;
    setIsResending(true);
    setMessage(null);
    setStatus(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "email_change",
        email: submittedEmail,
      });

      if (error) {
        console.error("[engineer-settings] resend email change failed:", error);
        setMessage(mapEmailChangeError(error));
        setStatus("error");
        return;
      }

      setMessage(ENGINEER_EMAIL_SETTINGS.resendSuccessMessage);
      setStatus("success");
    } finally {
      setIsResending(false);
    }
  }

  // Structural guard, not just "nothing else calls setMode": even if a
  // future change wired up another path into "change"/"sent", an OAuth-only
  // account (no password to reauthenticate with) must never be able to
  // render the password-reauth form.
  const effectiveMode: ViewMode = isPasswordUser ? mode : "view";

  return (
    <SectionCard
      id="email"
      title={ENGINEER_EMAIL_SETTINGS.title}
      description={ENGINEER_EMAIL_SETTINGS.description}
    >
      <div className="flex flex-col gap-4">
        {effectiveMode === "view" && (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  {ENGINEER_EMAIL_SETTINGS.currentEmailLabel}
                </span>
                <p className="text-sm font-medium break-all text-foreground select-all">{email}</p>
              </div>
              {isPasswordUser && (
                <button
                  type="button"
                  onClick={openChangeForm}
                  className="inline-flex h-9 w-fit shrink-0 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ENGINEER_EMAIL_SETTINGS.changeButtonLabel}
                </button>
              )}
            </div>
            {!isPasswordUser && (
              <p className="text-xs text-muted-foreground">
                {ENGINEER_EMAIL_SETTINGS.oauthOnlyNotice}
              </p>
            )}
          </>
        )}

        {effectiveMode === "change" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={newEmailId}>
                {FORM.newEmailLabel}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id={newEmailId}
                type="email"
                // Deliberately not "email": that hint tells the browser this
                // is a username-like field to autofill/pair with a saved
                // login, and combined with the current-password field right
                // below it, Chrome's password-manager heuristics can treat
                // the whole form as a login form and silently replace
                // whatever was typed here with the account's OWN saved
                // email the moment the password field is touched -- exactly
                // the opposite of "type the email you're changing TO".
                autoComplete="off"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder={FORM.newEmailPlaceholder}
                className="h-11"
                disabled={isSubmitting}
                required
              />
            </div>

            {isPasswordUser && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={currentPasswordId}>
                  {FORM.currentPasswordLabel}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={currentPasswordId}
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="h-11"
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}

            <FormStatusMessage message={message} status={status} />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isSubmitting ? FORM.submittingLabel : FORM.submitLabel}
              </button>
              <button
                type="button"
                onClick={cancelChangeForm}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ENGINEER_EMAIL_SETTINGS.cancelLabel}
              </button>
            </div>
          </form>
        )}

        {effectiveMode === "sent" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              <p className="font-semibold">{ENGINEER_EMAIL_SETTINGS.requestSentTitle}</p>
              <p className="mt-1">{ENGINEER_EMAIL_SETTINGS.requestSentDescription(submittedEmail)}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {ENGINEER_EMAIL_SETTINGS.requestSentSecureNotice}
            </p>
            <FormStatusMessage message={message} status={status} />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={isResending}
                aria-busy={isResending}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isResending ? ENGINEER_EMAIL_SETTINGS.resendingLabel : ENGINEER_EMAIL_SETTINGS.resendLabel}
              </button>
              <button
                type="button"
                onClick={cancelChangeForm}
                className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {ENGINEER_EMAIL_SETTINGS.cancelLabel}
              </button>
            </div>
          </div>
        )}

        {effectiveMode === "view" && <FormStatusMessage message={message} status={status} />}
      </div>
    </SectionCard>
  );
}
