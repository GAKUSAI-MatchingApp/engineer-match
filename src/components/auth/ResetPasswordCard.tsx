"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthHero } from "@/components/auth/AuthHero";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import {
  RESET_PASSWORD_ERRORS,
  RESET_PASSWORD_FORM,
  RESET_PASSWORD_SUCCESS,
  RESET_PASSWORD_VISUAL,
} from "@/constants/auth";
import { fadeUpItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGE_ID = "reset-password-error-message";
const FORGOT_PASSWORD_RETRY_LABEL = "パスワード再設定をリクエストし直す";

type Status = "checking" | "ready" | "invalid" | "success";

export function ResetPasswordCard() {
  const prefersReducedMotion = useReducedMotion();
  const variants = fadeUpItem(prefersReducedMotion, { duration: 0.5 });

  const [status, setStatus] = useState<Status>("checking");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // The /auth/callback route already exchanged the recovery `code` for a
    // session before redirecting here — this only confirms that session
    // actually landed (e.g. not an expired/reused/tampered link).
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!cancelled) {
        setStatus(data.user ? "ready" : "invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (formMessage) {
      errorRef.current?.focus();
    }
  }, [formMessage]);

  useEffect(() => {
    if (status === "invalid" || status === "success") {
      headingRef.current?.focus();
    }
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setFormMessage(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm-password") ?? "");

    if (password !== confirmPassword) {
      setFormMessage(RESET_PASSWORD_ERRORS.passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("[reset-password] updateUser failed:", error);
        const code = (error as { code?: string }).code ?? "";
        const rawMessage = error.message?.toLowerCase() ?? "";

        if (code === "weak_password" || rawMessage.includes("password")) {
          setFormMessage(RESET_PASSWORD_ERRORS.weakPassword);
        } else if (
          code === "session_not_found" ||
          rawMessage.includes("session") ||
          rawMessage.includes("token")
        ) {
          setStatus("invalid");
        } else {
          setFormMessage(RESET_PASSWORD_ERRORS.unexpected);
        }
        return;
      }

      // Force a fresh login with the new password rather than leaving the
      // recovery session active on a dashboard.
      await supabase.auth.signOut();
      setStatus("success");
    } catch (err) {
      console.error("[reset-password] unexpected error:", err);
      setFormMessage(RESET_PASSWORD_ERRORS.unexpected);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthHero
      imageSrc={RESET_PASSWORD_VISUAL.imageSrc}
      imageAlt={RESET_PASSWORD_VISUAL.imageAlt}
      imagePosition="center"
      headline={RESET_PASSWORD_VISUAL.title}
      description={RESET_PASSWORD_VISUAL.description}
      bullets={RESET_PASSWORD_VISUAL.bullets}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={variants}
        className="w-full max-w-md lg:max-w-[440px]"
      >
        <div className="rounded-[28px] border border-white/20 bg-slate-900/55 p-7 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-8">
          {status === "checking" ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-white/70" aria-hidden="true" />
            </div>
          ) : status === "invalid" ? (
            <div className="flex flex-col items-start gap-4">
              <h1
                ref={headingRef}
                tabIndex={-1}
                aria-live="assertive"
                className="text-lg font-semibold text-white focus:outline-none"
              >
                {RESET_PASSWORD_ERRORS.invalidOrExpiredLink}
              </h1>
              <Link
                href="/forgot-password"
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-indigo-950/20 transition-[filter] duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none"
              >
                {FORGOT_PASSWORD_RETRY_LABEL}
              </Link>
            </div>
          ) : status === "success" ? (
            <div className="flex flex-col items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15">
                <CheckCircle2 className="h-6 w-6 text-cyan-300" aria-hidden="true" />
              </div>
              <h1
                ref={headingRef}
                tabIndex={-1}
                aria-live="polite"
                className="text-lg font-semibold text-white focus:outline-none"
              >
                {RESET_PASSWORD_SUCCESS.title}
              </h1>
              <p className="text-sm text-white/70">{RESET_PASSWORD_SUCCESS.note}</p>
              <Link
                href="/login"
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-indigo-950/20 transition-[filter] duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none"
              >
                {RESET_PASSWORD_SUCCESS.loginCta}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {RESET_PASSWORD_FORM.title}
              </h1>
              <p className="mt-1.5 text-sm text-white/70">
                {RESET_PASSWORD_FORM.description}
              </p>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                <PasswordInput
                  id="password"
                  label={RESET_PASSWORD_FORM.password.label}
                  placeholder={RESET_PASSWORD_FORM.password.placeholder}
                  required
                  autoComplete="new-password"
                />
                <PasswordInput
                  id="confirm-password"
                  label={RESET_PASSWORD_FORM.confirmPassword.label}
                  placeholder={RESET_PASSWORD_FORM.confirmPassword.placeholder}
                  required
                  autoComplete="new-password"
                />

                <div
                  ref={errorRef}
                  tabIndex={-1}
                  role="alert"
                  aria-live="assertive"
                  id={ERROR_MESSAGE_ID}
                  className={
                    formMessage
                      ? "rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 focus:outline-none"
                      : "sr-only"
                  }
                >
                  {formMessage}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-indigo-950/20 hover:brightness-110 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {RESET_PASSWORD_FORM.loadingLabel}
                    </>
                  ) : (
                    RESET_PASSWORD_FORM.submitLabel
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </AuthHero>
  );
}
