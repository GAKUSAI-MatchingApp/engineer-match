"use client";

import { useEffect, useRef, useState, type ComponentProps, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";
import { AuthHero } from "@/components/auth/AuthHero";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AUTH_DEMO_ACTION_NOTICE,
  LOGIN_ERRORS,
  LOGIN_FORM,
  LOGIN_VISUAL,
} from "@/constants/auth";
import { fadeUpItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { ACTIVE_STATUS, getDashboardPathForRole, getUserAccount } from "@/lib/auth/account";

function GoogleIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3a7.15 7.15 0 0 1-10.65-3.76H1.4v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.41 14.33a7.2 7.2 0 0 1 0-4.62V6.62H1.4a12 12 0 0 0 0 10.8l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.4 11.4 0 0 0 12 0 12 12 0 0 0 1.4 6.62l4.01 3.09A7.15 7.15 0 0 1 12 4.77Z"
      />
    </svg>
  );
}

function GitHubIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.4-5.25 5.68.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .3.21.67.79.55A10.51 10.51 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

const ERROR_MESSAGE_ID = "login-error-message";

export function LoginCard() {
  const prefersReducedMotion = useReducedMotion();
  const variants = fadeUpItem(prefersReducedMotion, { duration: 0.5 });
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  function showDemoToast() {
    setToastMessage(AUTH_DEMO_ACTION_NOTICE);
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  useEffect(() => {
    if (formMessage) {
      errorRef.current?.focus();
    }
  }, [formMessage]);

  const isCredentialsError = formMessage === LOGIN_ERRORS.invalidCredentials;
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Prevent duplicate submission while a request is already in flight.
    if (isLoading) return;

    setFormMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        console.error("[login] signInWithPassword failed:", authError);
        const code = (authError as { code?: string }).code ?? "";
        const rawMessage = authError.message?.toLowerCase() ?? "";

        if (
          code === "email_not_confirmed" ||
          rawMessage.includes("email not confirmed")
        ) {
          setFormMessage(LOGIN_ERRORS.emailNotConfirmed);
        } else if (
          code === "invalid_credentials" ||
          rawMessage.includes("invalid login credentials")
        ) {
          setFormMessage(LOGIN_ERRORS.invalidCredentials);
        } else {
          setFormMessage(LOGIN_ERRORS.unexpected);
        }
        return;
      }

      const user = authData.user;
      if (!user) {
        setFormMessage(LOGIN_ERRORS.unexpected);
        return;
      }

      const account = await getUserAccount(supabase, user.id);

      if (!account) {
        await supabase.auth.signOut();
        setFormMessage(LOGIN_ERRORS.missingProfile);
        return;
      }

      if (account.status !== ACTIVE_STATUS) {
        // SUSPENDED/WITHDRAWN accounts must be indistinguishable from a
        // plain wrong-password attempt at the login screen, or the error
        // message itself leaks account existence/state to whoever is
        // trying the credentials (RD-2026-001 A-04/AC-07).
        await supabase.auth.signOut();
        setFormMessage(LOGIN_ERRORS.invalidCredentials);
        return;
      }

      if (account.role === "INSTRUCTOR") {
        // Valid credentials, active account -- there is just no dashboard
        // built for this role yet. Keep the session; do not sign out and do
        // not redirect anywhere.
        setFormMessage(LOGIN_ERRORS.instructorNotAvailable);
        return;
      }

      const dashboardPath = getDashboardPathForRole(account.role);
      if (!dashboardPath) {
        console.error("[login] unrecognized role from public.users:", account.role);
        await supabase.auth.signOut();
        setFormMessage(LOGIN_ERRORS.unsupportedRole);
        return;
      }

      router.push(dashboardPath);
      router.refresh();
    } catch (err) {
      console.error("[login] unexpected error:", err);
      setFormMessage(LOGIN_ERRORS.unexpected);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthHero
      imageSrc={LOGIN_VISUAL.imageSrc}
      imageAlt={LOGIN_VISUAL.imageAlt}
      imagePosition="center"
      headline={LOGIN_VISUAL.title}
      description={LOGIN_VISUAL.description}
      bullets={LOGIN_VISUAL.bullets}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={variants}
        className="w-full max-w-md lg:max-w-[440px]"
      >
        <div className="rounded-[28px] border border-white/20 bg-slate-900/55 p-7 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">{LOGIN_FORM.title}</h1>
          <p className="mt-1.5 text-sm text-white/70">
            {LOGIN_FORM.description}
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-white/90">
                {LOGIN_FORM.email.label}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFormMessage(null);
                }}
                aria-invalid={isCredentialsError}
                placeholder={LOGIN_FORM.email.placeholder}
                className="h-12 rounded-xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30"
              />
            </div>

            <PasswordInput
              id="password"
              label={LOGIN_FORM.password.label}
              placeholder={LOGIN_FORM.password.placeholder}
              required
              autoComplete="current-password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setFormMessage(null);
              }}
              invalid={isCredentialsError}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  name="remember"
                  className="border-white/30 bg-white/10 data-checked:border-cyan-300 data-checked:bg-cyan-400 data-checked:text-slate-950"
                />
                <Label htmlFor="remember" className="font-normal text-white/60">
                  {LOGIN_FORM.rememberMe}
                </Label>
              </div>
              <button
                type="button"
                onClick={showDemoToast}
                className="rounded text-sm font-medium text-cyan-300 transition-colors duration-200 hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {LOGIN_FORM.forgotPassword}
              </button>
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
                  {LOGIN_FORM.loadingLabel}
                </>
              ) : (
                LOGIN_FORM.submitLabel
              )}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-xs text-white/50">
              {LOGIN_FORM.dividerLabel}
            </span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={showDemoToast}
              className="h-12 w-full rounded-xl border border-white/40 bg-white/90 text-sm font-semibold text-[#111827] hover:bg-white"
            >
              <GoogleIcon className="h-4 w-4" />
              {LOGIN_FORM.google}
            </Button>
            <Button
              type="button"
              onClick={showDemoToast}
              className="h-12 w-full rounded-xl border border-white/40 bg-white/90 text-sm font-semibold text-[#111827] hover:bg-white"
            >
              <GitHubIcon className="h-4 w-4" />
              {LOGIN_FORM.github}
            </Button>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-white/70">
          {LOGIN_FORM.noAccount}{" "}
          <Link
            href={LOGIN_FORM.registerHref}
            className="rounded font-semibold text-cyan-300 underline underline-offset-2 transition-colors duration-200 hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
          >
            {LOGIN_FORM.registerCta}
          </Link>
        </p>
      </motion.div>

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
    </AuthHero>
  );
}
