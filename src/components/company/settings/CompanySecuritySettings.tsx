"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  COMPANY_SECURITY_SETTINGS,
  COMPANY_SETTINGS_UNAVAILABLE_NOTE,
} from "@/constants/company-settings";
import { createClient } from "@/lib/supabase/client";

export function CompanySecuritySettings() {
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: COMPANY_SECURITY_SETTINGS.errorTooShort });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: COMPANY_SECURITY_SETTINGS.errorMismatch });
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSubmitting(false);

    if (error) {
      console.error("[company-settings] failed to update password:", error);
      setMessage({ type: "error", text: COMPANY_SECURITY_SETTINGS.errorGeneric });
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setMessage({ type: "success", text: COMPANY_SECURITY_SETTINGS.successMessage });
  }

  return (
    <SectionCard
      title={COMPANY_SECURITY_SETTINGS.title}
      description={COMPANY_SECURITY_SETTINGS.description}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor={newPasswordId}>{COMPANY_SECURITY_SETTINGS.newPasswordLabel}</Label>
          <div className="relative">
            <Input
              id={newPasswordId}
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="h-11 pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "パスワードを非表示にする" : "パスワードを表示する"}
              aria-pressed={visible}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {visible ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={confirmPasswordId}>{COMPANY_SECURITY_SETTINGS.confirmPasswordLabel}</Label>
          <Input
            id={confirmPasswordId}
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-11"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || newPassword === "" || confirmPassword === ""}
          className="inline-flex h-10 w-fit items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? COMPANY_SECURITY_SETTINGS.submittingLabel : COMPANY_SECURITY_SETTINGS.submitLabel}
        </button>

        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-700"}`}
          >
            {message.text}
          </p>
        )}
      </form>

      <div className="flex flex-col divide-y divide-border">
        <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
          <div className="min-w-0">
            <Label htmlFor="security-2fa" className="text-foreground">
              {COMPANY_SECURITY_SETTINGS.twoFactor.label}
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {COMPANY_SECURITY_SETTINGS.twoFactor.description}
            </p>
          </div>
          <Switch
            id="security-2fa"
            checked={twoFactorEnabled}
            onCheckedChange={setTwoFactorEnabled}
          />
        </div>

        <div className="py-4">
          <p className="text-sm font-semibold text-foreground">
            {COMPANY_SECURITY_SETTINGS.loginHistory.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {COMPANY_SECURITY_SETTINGS.loginHistory.description}
          </p>
          <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            {COMPANY_SECURITY_SETTINGS.loginHistory.unavailableMessage}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 last:pb-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {COMPANY_SECURITY_SETTINGS.sessionManagement.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {COMPANY_SECURITY_SETTINGS.sessionManagement.description}
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex h-9 shrink-0 cursor-not-allowed items-center justify-center rounded-xl border border-border bg-muted px-4 text-sm font-semibold text-muted-foreground"
          >
            {COMPANY_SECURITY_SETTINGS.sessionManagement.revokeAllLabel}
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{COMPANY_SETTINGS_UNAVAILABLE_NOTE}</p>
    </SectionCard>
  );
}
