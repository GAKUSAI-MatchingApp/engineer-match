"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthHero } from "@/components/auth/AuthHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FORGOT_PASSWORD_ERRORS,
  FORGOT_PASSWORD_FORM,
  FORGOT_PASSWORD_SENT,
  FORGOT_PASSWORD_VISUAL,
} from "@/constants/auth";
import { fadeUpItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGE_ID = "forgot-password-error-message";

export function ForgotPasswordCard() {
  const prefersReducedMotion = useReducedMotion();
  const variants = fadeUpItem(prefersReducedMotion, { duration: 0.5 });

  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (formMessage) {
      errorRef.current?.focus();
    }
  }, [formMessage]);

  useEffect(() => {
    if (sent) {
      sentHeadingRef.current?.focus();
    }
  }, [sent]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setFormMessage(null);
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim();

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        console.error("[forgot-password] resetPasswordForEmail failed:", error);
        const status = (error as { status?: number }).status ?? 0;
        const rawMessage = error.message?.toLowerCase() ?? "";

        if (status === 429 || rawMessage.includes("rate limit")) {
          setFormMessage(FORGOT_PASSWORD_ERRORS.rateLimited);
          return;
        }
        if (rawMessage.includes("email")) {
          setFormMessage(FORGOT_PASSWORD_ERRORS.invalidEmail);
          return;
        }
        setFormMessage(FORGOT_PASSWORD_ERRORS.unexpected);
        return;
      }

      // Supabase returns success here regardless of whether the account
      // exists, so this branch never leaks account existence — matching the
      // login form's existing anti-enumeration posture.
      setSent(true);
    } catch (err) {
      console.error("[forgot-password] unexpected error:", err);
      setFormMessage(FORGOT_PASSWORD_ERRORS.unexpected);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthHero
      imageSrc={FORGOT_PASSWORD_VISUAL.imageSrc}
      imageAlt={FORGOT_PASSWORD_VISUAL.imageAlt}
      imagePosition="center"
      headline={FORGOT_PASSWORD_VISUAL.title}
      description={FORGOT_PASSWORD_VISUAL.description}
      bullets={FORGOT_PASSWORD_VISUAL.bullets}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={variants}
        className="w-full max-w-md lg:max-w-[440px]"
      >
        <div className="rounded-[28px] border border-white/20 bg-slate-900/55 p-7 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-8">
          {sent ? (
            <div className="flex flex-col items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15">
                <CheckCircle2 className="h-6 w-6 text-cyan-300" aria-hidden="true" />
              </div>
              <h1
                ref={sentHeadingRef}
                tabIndex={-1}
                aria-live="polite"
                className="text-lg font-semibold text-white focus:outline-none"
              >
                {FORGOT_PASSWORD_SENT.title}
              </h1>
              <p className="text-sm text-white/70">{FORGOT_PASSWORD_SENT.note}</p>
              <Link
                href="/login"
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-indigo-950/20 transition-[filter] duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none"
              >
                {FORGOT_PASSWORD_SENT.loginCta}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {FORGOT_PASSWORD_FORM.title}
              </h1>
              <p className="mt-1.5 text-sm text-white/70">
                {FORGOT_PASSWORD_FORM.description}
              </p>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-white/90">
                    {FORGOT_PASSWORD_FORM.email.label}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={FORGOT_PASSWORD_FORM.email.placeholder}
                    className="h-12 rounded-xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                  />
                </div>

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
                      {FORGOT_PASSWORD_FORM.loadingLabel}
                    </>
                  ) : (
                    FORGOT_PASSWORD_FORM.submitLabel
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-white/70">
                <Link
                  href="/login"
                  className="rounded font-semibold text-cyan-300 underline underline-offset-2 transition-colors duration-200 hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
                >
                  {FORGOT_PASSWORD_FORM.backToLoginLabel}
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </AuthHero>
  );
}
