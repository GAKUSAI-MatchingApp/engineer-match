"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Building2, CheckCircle2, Loader2, UserRound } from "lucide-react";
import { AuthHero } from "@/components/auth/AuthHero";
import { DemoAuthNotice } from "@/components/auth/DemoAuthNotice";
import {
  OAuthProviderButtons,
  type OAuthProvider,
} from "@/components/auth/OAuthProviderButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  REGISTER_AUTH_NOTICE,
  REGISTER_EMAIL_CONFIRMATION,
  REGISTER_ERRORS,
  REGISTER_FORM,
  REGISTER_VISUAL,
} from "@/constants/auth";
import { fadeUpItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { getDashboardPathForRole, getUserAccount } from "@/lib/auth/account";
import { saveCompanyProfile } from "@/lib/company/profile";

export type AccountType = "engineer" | "company";

/** Roles the public registration page may submit. ADMIN can never originate here. */
type SignupRole = "ENGINEER" | "INSTRUCTOR" | "COMPANY";

const ALLOWED_SIGNUP_ROLES: readonly SignupRole[] = ["ENGINEER", "INSTRUCTOR", "COMPANY"];

function mapAccountTypeToRole(accountType: AccountType): SignupRole {
  return accountType === "engineer" ? "ENGINEER" : "COMPANY";
}

const ERROR_MESSAGE_ID = "register-error-message";

const ACCOUNT_TYPE_OPTIONS = [
  { ...REGISTER_FORM.accountTypes.engineer, icon: UserRound },
  { ...REGISTER_FORM.accountTypes.company, icon: Building2 },
] as const;

function AgreeTerms({ id }: { id: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Checkbox id={id} name={id} required className="mt-0.5" />
      <Label htmlFor={id} className="font-normal text-white/60">
        <Link
          href="/terms"
          className="rounded text-cyan-300 underline-offset-2 hover:underline hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
        >
          {REGISTER_FORM.agreeTermsTermsLabel}
        </Link>
        {REGISTER_FORM.agreeTermsMiddle}
        <Link
          href="/privacy"
          className="rounded text-cyan-300 underline-offset-2 hover:underline hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
        >
          {REGISTER_FORM.agreeTermsPrivacyLabel}
        </Link>
        {REGISTER_FORM.agreeTermsSuffix}
      </Label>
    </div>
  );
}

interface RegisterCardProps {
  initialAccountType?: AccountType;
  blockedRole?: "admin";
}

export function RegisterCard({ initialAccountType, blockedRole }: RegisterCardProps) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType | null>(
    initialAccountType ?? null,
  );
  const [selectorResetKey, setSelectorResetKey] = useState(0);
  const resetAccountType = () => {
    setAccountType(null);
    setSelectorResetKey((key) => key + 1);
  };
  // Set once signUp succeeds but no session was returned (email confirmation
  // required) — swaps the active form for a "check your email" message.
  const [confirmationRole, setConfirmationRole] = useState<AccountType | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const completionHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const entrance = fadeUpItem(prefersReducedMotion, { duration: 0.5 });

  useEffect(() => {
    if (confirmationRole) {
      completionHeadingRef.current?.focus();
    }
  }, [confirmationRole]);

  useEffect(() => {
    if (formMessage) {
      errorRef.current?.focus();
    }
  }, [formMessage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>, type: AccountType) {
    event.preventDefault();
    if (isLoading || oauthLoading) return;

    setFormMessage(null);

    // Validate the selected role before ever calling signUp — only
    // ENGINEER/INSTRUCTOR/COMPANY may originate from this page, never ADMIN.
    const selectedRole = mapAccountTypeToRole(type);
    if (!ALLOWED_SIGNUP_ROLES.includes(selectedRole)) {
      setFormMessage(REGISTER_ERRORS.roleRequired);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const name =
      type === "engineer"
        ? String(formData.get("name") ?? "").trim()
        : String(formData.get("representative") ?? "").trim();
    const companyName =
      type === "company" ? String(formData.get("companyName") ?? "").trim() : "";
    const passwordField = type === "engineer" ? "engineer-password" : "company-password";
    const confirmField =
      type === "engineer" ? "engineer-confirm-password" : "company-confirm-password";
    const password = String(formData.get(passwordField) ?? "");
    const confirmPassword = String(formData.get(confirmField) ?? "");

    if (password !== confirmPassword) {
      setFormMessage(REGISTER_ERRORS.passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: selectedRole,
            name,
          },
        },
      });

      if (error) {
        console.error("[signup] signUp failed:", error);
        const code = (error as { code?: string }).code ?? "";
        const status = (error as { status?: number }).status ?? 0;
        const rawMessage = error.message?.toLowerCase() ?? "";

        if (
          code === "user_already_exists" ||
          rawMessage.includes("already registered") ||
          rawMessage.includes("already exists")
        ) {
          setFormMessage(REGISTER_ERRORS.emailInUse);
        } else if (
          code === "over_email_send_rate_limit" ||
          code === "over_request_rate_limit" ||
          status === 429 ||
          rawMessage.includes("rate limit")
        ) {
          // Checked before the generic "email" match below — Supabase's rate
          // limit message ("email rate limit exceeded") also contains
          // "email" and would otherwise be misreported as an invalid address.
          setFormMessage(REGISTER_ERRORS.rateLimited);
        } else if (code === "weak_password" || rawMessage.includes("password")) {
          setFormMessage(REGISTER_ERRORS.weakPassword);
        } else if (
          code === "invalid_email" ||
          code === "email_address_invalid" ||
          rawMessage.includes("email")
        ) {
          setFormMessage(REGISTER_ERRORS.invalidEmail);
        } else {
          setFormMessage(REGISTER_ERRORS.unexpected);
        }
        return;
      }

      if (!data.session) {
        // Email confirmation is required before a session (and the
        // public.users row's ability to be read back) is usable.
        setConfirmationRole(type);
        return;
      }

      const user = data.user;
      if (!user) {
        setFormMessage(REGISTER_ERRORS.unexpected);
        return;
      }

      // public.users is populated by the handle_new_user() SECURITY DEFINER
      // trigger on auth.users insert — never inserted into directly here.
      const account = await getUserAccount(supabase, user.id);
      if (!account) {
        setFormMessage(REGISTER_ERRORS.missingProfile);
        return;
      }

      if (type === "company" && companyName) {
        // No trigger creates company_profiles on signup (see saveCompanyProfile's
        // own docs) — without this, the 会社名 the user just typed would be
        // silently discarded and the dashboard would fall back to showing the
        // representative's name instead.
        const { error: profileError } = await saveCompanyProfile(supabase, user.id, {
          company_name: companyName,
          logo_url: null,
          prefecture: null,
          address: null,
          business_description: null,
          website_url: null,
          contact_person: null,
          company_size: null,
          industry_category_id: null,
          established_year: null,
        });
        if (profileError) {
          console.error("[signup] saveCompanyProfile failed:", profileError);
          // Non-fatal: the account itself was created successfully. The
          // company can still set their name later on the Company Profile page.
        }
      }

      if (account.role === "INSTRUCTOR") {
        setFormMessage(REGISTER_ERRORS.instructorNotAvailable);
        return;
      }

      const dashboardPath = getDashboardPathForRole(account.role);
      if (!dashboardPath) {
        console.error("[signup] unrecognized role from public.users:", account.role);
        setFormMessage(REGISTER_ERRORS.unexpected);
        return;
      }

      router.push(dashboardPath);
      router.refresh();
    } catch (err) {
      console.error("[signup] unexpected error:", err);
      setFormMessage(REGISTER_ERRORS.network);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuthSignUp(provider: OAuthProvider) {
    if (isLoading || oauthLoading) return;

    setFormMessage(null);
    setOauthLoading(provider);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/oauth/callback`,
        },
      });

      if (error) {
        console.error(`[signup] signInWithOAuth(${provider}) failed:`, error);
        setFormMessage(REGISTER_ERRORS.oauthFailed);
        setOauthLoading(null);
      }
    } catch (err) {
      console.error(`[signup] unexpected OAuth error (${provider}):`, err);
      setFormMessage(REGISTER_ERRORS.oauthFailed);
      setOauthLoading(null);
    }
  }

  const stepVariants: Variants = useMemo(
    () => ({
      hidden: { opacity: 0, x: prefersReducedMotion ? 0 : 20 },
      visible: { opacity: 1, x: 0, transition: { duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" } },
      exit: { opacity: 0, x: prefersReducedMotion ? 0 : -20, transition: { duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" } },
    }),
    [prefersReducedMotion],
  );

  return (
    <AuthHero
      imageSrc={REGISTER_VISUAL.imageSrc}
      imageAlt={REGISTER_VISUAL.imageAlt}
      imagePosition="65% 25%"
      imageFlip
      headline={REGISTER_VISUAL.title}
      description={REGISTER_VISUAL.description}
      bullets={REGISTER_VISUAL.bullets}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={entrance}
        className="w-full max-w-md lg:max-w-[500px]"
      >
        <div className="rounded-[28px] border border-white/20 bg-slate-900/55 p-7 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-9">
          <h1 className="text-2xl font-bold tracking-tight text-white">{REGISTER_FORM.title}</h1>
          <p className="mt-1.5 text-sm text-white/70">
            {REGISTER_FORM.description}
          </p>

          <div className="mt-5">
            <DemoAuthNotice line1={REGISTER_AUTH_NOTICE.line1} line2={REGISTER_AUTH_NOTICE.line2} />
          </div>

          <div>
            {confirmationRole ? (
              <motion.div
                key="completion"
                initial="hidden"
                animate="visible"
                variants={stepVariants}
                className="mt-6 flex flex-col items-start gap-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15">
                  <CheckCircle2
                    className="h-6 w-6 text-cyan-300"
                    aria-hidden="true"
                  />
                </div>
                <h2
                  ref={completionHeadingRef}
                  tabIndex={-1}
                  aria-live="polite"
                  className="text-lg font-semibold text-white focus:outline-none"
                >
                  {REGISTER_EMAIL_CONFIRMATION.title}
                </h2>
                <p className="text-sm text-white/70">{REGISTER_EMAIL_CONFIRMATION.note}</p>
                <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
                  <Link
                    href={REGISTER_FORM.loginHref}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-indigo-950/20 transition-[filter] duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none"
                  >
                    {REGISTER_EMAIL_CONFIRMATION.loginCta}
                  </Link>
                </div>
              </motion.div>
            ) : accountType === null ? (
              <motion.div
                key={`select-${selectorResetKey}`}
                initial="hidden"
                animate="visible"
                variants={stepVariants}
                className="mt-6"
              >
                {blockedRole === "admin" && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                  >
                    {REGISTER_ERRORS.adminNotAllowed}
                  </div>
                )}
                <RadioGroup
                  key={selectorResetKey}
                  aria-label={REGISTER_FORM.accountTypeLabel}
                  value={accountType}
                  onValueChange={(value) => setAccountType(value as AccountType)}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      htmlFor={option.value}
                      onClick={() => setAccountType(option.value as AccountType)}
                      className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-5 text-left transition-colors duration-200 hover:bg-white/15 has-[[data-checked]]:border-cyan-300 has-[[data-checked]]:bg-cyan-400/15 has-[[data-checked]]:ring-2 has-[[data-checked]]:ring-cyan-300/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                          <option.icon
                            className="h-6 w-6 text-cyan-300"
                            aria-hidden="true"
                          />
                        </div>
                        <RadioGroupItem value={option.value} id={option.value} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {option.title}
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </motion.div>
            ) : accountType === "engineer" ? (
              <motion.form
                key="engineer"
                initial="hidden"
                animate="visible"
                variants={stepVariants}
                className="mt-6 space-y-5"
                onSubmit={(event) => handleSubmit(event, "engineer")}
              >
                <button
                  type="button"
                  onClick={resetAccountType}
                  className="w-fit rounded text-xs font-medium text-white/60 transition-colors duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
                >
                  ← {REGISTER_FORM.backLabel}
                </button>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="engineer-name" className="text-white/90">
                    {REGISTER_FORM.engineerFields.name.label}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="engineer-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder={REGISTER_FORM.engineerFields.name.placeholder}
                    className="h-12 rounded-xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="engineer-email" className="text-white/90">
                    {REGISTER_FORM.engineerFields.email.label}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="engineer-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={REGISTER_FORM.engineerFields.email.placeholder}
                    className="h-12 rounded-xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                  />
                </div>

                <PasswordInput
                  id="engineer-password"
                  label={REGISTER_FORM.engineerFields.password.label}
                  placeholder={REGISTER_FORM.engineerFields.password.placeholder}
                  required
                  autoComplete="new-password"
                />
                <PasswordInput
                  id="engineer-confirm-password"
                  label={REGISTER_FORM.engineerFields.confirmPassword.label}
                  placeholder={REGISTER_FORM.engineerFields.confirmPassword.placeholder}
                  required
                  autoComplete="new-password"
                />

                <AgreeTerms id="engineer-agree-terms" />

                <div
                  ref={accountType === "engineer" ? errorRef : undefined}
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
                  disabled={isLoading || oauthLoading !== null}
                  aria-busy={isLoading}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-indigo-950/20 hover:brightness-110 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {REGISTER_FORM.loadingLabel}
                    </>
                  ) : (
                    REGISTER_FORM.engineerFields.submitLabel
                  )}
                </Button>
                <OAuthProviderButtons
                  dividerLabel={REGISTER_FORM.dividerLabel}
                  googleLabel={REGISTER_FORM.google}
                  githubLabel={REGISTER_FORM.github}
                  loadingProvider={oauthLoading}
                  disabled={isLoading}
                  onProviderClick={handleOAuthSignUp}
                />
              </motion.form>
            ) : (
              <motion.form
                key="company"
                initial="hidden"
                animate="visible"
                variants={stepVariants}
                className="mt-6 space-y-5"
                onSubmit={(event) => handleSubmit(event, "company")}
              >
                <button
                  type="button"
                  onClick={resetAccountType}
                  className="w-fit rounded text-xs font-medium text-white/60 transition-colors duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
                >
                  ← {REGISTER_FORM.backLabel}
                </button>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="company-name" className="text-white/90">
                    {REGISTER_FORM.companyFields.companyName.label}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company-name"
                    name="companyName"
                    type="text"
                    required
                    autoComplete="organization"
                    placeholder={REGISTER_FORM.companyFields.companyName.placeholder}
                    className="h-12 rounded-xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="company-representative" className="text-white/90">
                    {REGISTER_FORM.companyFields.representative.label}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company-representative"
                    name="representative"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder={REGISTER_FORM.companyFields.representative.placeholder}
                    className="h-12 rounded-xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="company-email" className="text-white/90">
                    {REGISTER_FORM.companyFields.email.label}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={REGISTER_FORM.companyFields.email.placeholder}
                    className="h-12 rounded-xl border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                  />
                </div>

                <PasswordInput
                  id="company-password"
                  label={REGISTER_FORM.companyFields.password.label}
                  placeholder={REGISTER_FORM.companyFields.password.placeholder}
                  required
                  autoComplete="new-password"
                />
                <PasswordInput
                  id="company-confirm-password"
                  label={REGISTER_FORM.companyFields.confirmPassword.label}
                  placeholder={REGISTER_FORM.companyFields.confirmPassword.placeholder}
                  required
                  autoComplete="new-password"
                />

                <AgreeTerms id="company-agree-terms" />

                <div
                  ref={accountType === "company" ? errorRef : undefined}
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
                  disabled={isLoading || oauthLoading !== null}
                  aria-busy={isLoading}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-indigo-950/20 hover:brightness-110 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {REGISTER_FORM.loadingLabel}
                    </>
                  ) : (
                    REGISTER_FORM.companyFields.submitLabel
                  )}
                </Button>
                <OAuthProviderButtons
                  dividerLabel={REGISTER_FORM.dividerLabel}
                  googleLabel={REGISTER_FORM.google}
                  githubLabel={REGISTER_FORM.github}
                  loadingProvider={oauthLoading}
                  disabled={isLoading}
                  onProviderClick={handleOAuthSignUp}
                />
              </motion.form>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-white/70">
          {REGISTER_FORM.hasAccount}{" "}
          <Link
            href={REGISTER_FORM.loginHref}
            className="rounded font-semibold text-white underline underline-offset-2 transition-colors duration-200 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            {REGISTER_FORM.loginCta}
          </Link>
        </p>
      </motion.div>
    </AuthHero>
  );
}
