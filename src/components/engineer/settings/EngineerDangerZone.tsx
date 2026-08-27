"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { ENGINEER_DANGER_ZONE } from "@/constants/engineer-settings";
import { createClient } from "@/lib/supabase/client";
import { countOngoingApplications } from "@/lib/engineer/applications";
import { withdrawOwnAccount } from "@/lib/auth/account";

type DialogPhase = "loading" | "form" | "submitting";

const { dialog: DIALOG } = ENGINEER_DANGER_ZONE;

export function EngineerDangerZone() {
  const router = useRouter();
  const titleId = useId();
  const reasonId = useId();
  const passwordId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<DialogPhase>("loading");
  const [ongoingCount, setOngoingCount] = useState(0);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && phase !== "submitting") closeDialog();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, phase]);

  useEffect(() => {
    if (phase === "form") confirmButtonRef.current?.focus();
  }, [phase]);

  async function openDialog() {
    setIsOpen(true);
    setPhase("loading");
    setError(null);
    setReason("");
    setPassword("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const count = await countOngoingApplications(supabase, user.id);
      setOngoingCount(count);
    }

    setPhase("form");
  }

  function closeDialog() {
    if (phase === "submitting") return;
    setIsOpen(false);
    setError(null);
    setPassword("");
  }

  async function handleWithdraw() {
    if (phase === "submitting" || password === "") return;
    setError(null);
    setPhase("submitting");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError(DIALOG.errorGeneric);
      setPhase("form");
      return;
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (reauthError) {
      setError(DIALOG.errorPasswordInvalid);
      setPhase("form");
      return;
    }

    const { error: withdrawError } = await withdrawOwnAccount(supabase);
    if (withdrawError) {
      console.error("[engineer-settings] withdrawal failed:", withdrawError);
      setError(DIALOG.errorGeneric);
      setPhase("form");
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-red-700">{ENGINEER_DANGER_ZONE.title}</h2>
      <p className="mt-1 text-sm text-red-700/80">{ENGINEER_DANGER_ZONE.description}</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {ENGINEER_DANGER_ZONE.withdraw.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ENGINEER_DANGER_ZONE.withdraw.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void openDialog()}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {ENGINEER_DANGER_ZONE.withdraw.buttonLabel}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={DIALOG.cancelLabel}
            onClick={closeDialog}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex w-full max-w-md flex-col gap-5 rounded-2xl bg-surface p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <TriangleAlert className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>
              <h2 id={titleId} className="text-base font-semibold text-foreground">
                {DIALOG.title}
              </h2>
            </div>

            {phase === "loading" ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {ongoingCount > 0 && (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {DIALOG.ongoingApplicationsWarning(ongoingCount)}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">{DIALOG.dataRetentionNote}</p>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={reasonId}>{DIALOG.reasonLabel}</Label>
                  <Textarea
                    id={reasonId}
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value.slice(0, DIALOG.reasonMaxLength))
                    }
                    placeholder={DIALOG.reasonPlaceholder}
                    maxLength={DIALOG.reasonMaxLength}
                    disabled={phase === "submitting"}
                  />
                  <p className="text-xs text-muted-foreground">{DIALOG.reasonNote}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={passwordId}>
                    {DIALOG.passwordLabel}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={passwordId}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={DIALOG.passwordPlaceholder}
                    className="h-11"
                    disabled={phase === "submitting"}
                    required
                  />
                </div>

                <FormStatusMessage message={error} status={error ? "error" : null} />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={phase === "submitting"}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {DIALOG.cancelLabel}
                  </button>
                  <button
                    type="button"
                    ref={confirmButtonRef}
                    onClick={() => void handleWithdraw()}
                    disabled={phase === "submitting" || password === ""}
                    aria-busy={phase === "submitting"}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {phase === "submitting" && (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    {phase === "submitting" ? DIALOG.submittingLabel : DIALOG.confirmLabel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
