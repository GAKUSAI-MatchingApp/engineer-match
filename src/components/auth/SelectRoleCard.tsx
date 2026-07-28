"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Building2, Loader2, UserRound } from "lucide-react";
import { AuthHero } from "@/components/auth/AuthHero";
import { SELECT_ROLE_ERRORS, SELECT_ROLE_FORM, SELECT_ROLE_VISUAL } from "@/constants/auth";
import { fadeUpItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import {
  finalizeOAuthRole,
  getDashboardPathForRole,
  getUserAccount,
  type OAuthOnboardingRole,
} from "@/lib/auth/account";

const ERROR_MESSAGE_ID = "select-role-error-message";

/**
 * Only ENGINEER/COMPANY are offered here — matching finalize_oauth_role()'s
 * own allow-list. ADMIN and INSTRUCTOR are never rendered as options.
 */
const ROLE_OPTIONS: ReadonlyArray<{
  role: OAuthOnboardingRole;
  title: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    role: "ENGINEER",
    title: SELECT_ROLE_FORM.options.engineer.title,
    description: SELECT_ROLE_FORM.options.engineer.description,
    icon: UserRound,
  },
  {
    role: "COMPANY",
    title: SELECT_ROLE_FORM.options.company.title,
    description: SELECT_ROLE_FORM.options.company.description,
    icon: Building2,
  },
];

export function SelectRoleCard() {
  const prefersReducedMotion = useReducedMotion();
  const variants = fadeUpItem(prefersReducedMotion, { duration: 0.5 });
  const router = useRouter();

  const [pendingRole, setPendingRole] = useState<OAuthOnboardingRole | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  async function handleSelect(role: OAuthOnboardingRole) {
    if (pendingRole) return;

    setFormMessage(null);
    setPendingRole(role);

    try {
      const supabase = createClient();
      const { data: account, error } = await finalizeOAuthRole(supabase, role);

      if (error) {
        console.error("[select-role] finalize_oauth_role failed:", error);

        if (error.code === "23505") {
          // Verified email already belongs to a different public.users row
          // (a separate, non-linked account with the same address).
          setFormMessage(SELECT_ROLE_ERRORS.emailInUse);
          setPendingRole(null);
          return;
        }

        if (error.code === "42710") {
          // Already onboarded — a concurrent call (double click, second tab)
          // beat this one to it. Not a failure: look up the row it created
          // and continue to the dashboard exactly as a success would.
          const supabaseForLookup = createClient();
          const {
            data: { user },
          } = await supabaseForLookup.auth.getUser();
          const existing = user ? await getUserAccount(supabaseForLookup, user.id) : null;
          const dashboardPath = existing ? getDashboardPathForRole(existing.role) : null;

          if (dashboardPath) {
            router.push(dashboardPath);
            router.refresh();
            return;
          }
        }

        setFormMessage(SELECT_ROLE_ERRORS.unexpected);
        setPendingRole(null);
        return;
      }

      const dashboardPath = account ? getDashboardPathForRole(account.role) : null;
      if (!dashboardPath) {
        console.error("[select-role] finalize_oauth_role returned unexpected role:", account?.role);
        setFormMessage(SELECT_ROLE_ERRORS.unexpected);
        setPendingRole(null);
        return;
      }

      router.push(dashboardPath);
      router.refresh();
    } catch (err) {
      console.error("[select-role] unexpected error:", err);
      setFormMessage(SELECT_ROLE_ERRORS.unexpected);
      setPendingRole(null);
    }
  }

  return (
    <AuthHero
      imageSrc={SELECT_ROLE_VISUAL.imageSrc}
      imageAlt={SELECT_ROLE_VISUAL.imageAlt}
      imagePosition="center"
      headline={SELECT_ROLE_VISUAL.title}
      description={SELECT_ROLE_VISUAL.description}
      bullets={SELECT_ROLE_VISUAL.bullets}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={variants}
        className="w-full max-w-md lg:max-w-[440px]"
      >
        <div className="rounded-[28px] border border-white/20 bg-slate-900/55 p-7 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {SELECT_ROLE_FORM.title}
          </h1>
          <p className="mt-1.5 text-sm text-white/70">{SELECT_ROLE_FORM.description}</p>

          <div
            role="alert"
            aria-live="assertive"
            id={ERROR_MESSAGE_ID}
            className={
              formMessage
                ? "mt-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                : "sr-only"
            }
          >
            {formMessage}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {ROLE_OPTIONS.map((option) => {
              const isPending = pendingRole === option.role;
              const disabled = pendingRole !== null;

              return (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => handleSelect(option.role)}
                  disabled={disabled}
                  aria-busy={isPending}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 text-left transition-colors duration-200 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    {isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-300" aria-hidden="true" />
                    ) : (
                      <option.icon className="h-6 w-6 text-cyan-300" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {isPending ? SELECT_ROLE_FORM.loadingLabel : option.title}
                    </p>
                    <p className="mt-1 text-xs text-white/60">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AuthHero>
  );
}
