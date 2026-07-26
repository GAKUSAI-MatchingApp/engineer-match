"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ENGINEER_SECURITY_SETTINGS } from "@/constants/engineer-settings";
import { createClient } from "@/lib/supabase/client";

export function EngineerSecuritySettings() {
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: ENGINEER_SECURITY_SETTINGS.errorTooShort });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: ENGINEER_SECURITY_SETTINGS.errorMismatch });
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email) {
      setIsSubmitting(false);
      setMessage({ type: "error", text: ENGINEER_SECURITY_SETTINGS.errorGeneric });
      return;
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });
    if (reauthError) {
      setIsSubmitting(false);
      setMessage({ type: "error", text: ENGINEER_SECURITY_SETTINGS.errorCurrentPasswordInvalid });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSubmitting(false);

    if (error) {
      console.error("[engineer-settings] failed to update password:", error);
      setMessage({ type: "error", text: ENGINEER_SECURITY_SETTINGS.errorGeneric });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage({ type: "success", text: ENGINEER_SECURITY_SETTINGS.successMessage });
  }

  return (
    <SectionCard
      title={ENGINEER_SECURITY_SETTINGS.title}
      description={ENGINEER_SECURITY_SETTINGS.description}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={currentPasswordId}>
            {ENGINEER_SECURITY_SETTINGS.currentPasswordLabel}
          </Label>
          <Input
            id={currentPasswordId}
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-11"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={newPasswordId}>{ENGINEER_SECURITY_SETTINGS.newPasswordLabel}</Label>
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
          <Label htmlFor={confirmPasswordId}>
            {ENGINEER_SECURITY_SETTINGS.confirmPasswordLabel}
          </Label>
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
          disabled={
            isSubmitting || currentPassword === "" || newPassword === "" || confirmPassword === ""
          }
          className="inline-flex h-10 w-fit items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting
            ? ENGINEER_SECURITY_SETTINGS.submittingLabel
            : ENGINEER_SECURITY_SETTINGS.submitLabel}
        </button>
      </form>

      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`mt-4 text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-700"}`}
        >
          {message.text}
        </p>
      )}
    </SectionCard>
  );
}
