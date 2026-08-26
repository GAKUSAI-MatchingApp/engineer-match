"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Link2, Loader2, TriangleAlert, Unlink2, X } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ENGINEER_LINE_SETTINGS } from "@/constants/engineer-settings";
import {
  getLineLinkStatus,
  setLineNotificationsEnabled,
  unlinkLineAccount,
  type LineLink,
} from "@/lib/engineer/line-link";
import { createClient } from "@/lib/supabase/client";

const { toast: TOAST, active: ACTIVE, needsFriend: NEEDS_FRIEND, unlinked: UNLINKED, unlinkDialog: DIALOG } =
  ENGINEER_LINE_SETTINGS;

const LINE_ADD_FRIEND_URL = process.env.NEXT_PUBLIC_LINE_OA_ADD_FRIEND_URL;

interface EngineerLineSettingsProps {
  initialLink: LineLink | null;
  /** ?lineLinked= / ?lineError= / ?active= left by /auth/line/callback -- read server-side (page.tsx's searchParams) so the toast renders identically on the server and on hydration, with no client-only effect needed. */
  lineLinked?: string;
  lineError?: string;
  lineActive?: string;
}

type ToastMessage = { type: "success" | "error"; text: string };

function deriveInitialToast({
  lineLinked,
  lineError,
  lineActive,
}: Pick<EngineerLineSettingsProps, "lineLinked" | "lineError" | "lineActive">): ToastMessage | null {
  if (lineLinked === "1") {
    return {
      type: "success",
      text: lineActive === "1" ? TOAST.linkedActive : TOAST.linkedNeedsFriend,
    };
  }
  if (lineError) {
    const text =
      lineError === "already_linked"
        ? TOAST.errorAlreadyLinked
        : lineError === "state_mismatch"
          ? TOAST.errorStateMismatch
          : lineError === "denied"
            ? TOAST.errorDenied
            : lineError === "ineligible"
              ? TOAST.errorIneligible
              : TOAST.errorGeneric;
    return { type: "error", text };
  }
  return null;
}

export function EngineerLineSettings({
  initialLink,
  lineLinked,
  lineError,
  lineActive,
}: EngineerLineSettingsProps) {
  const [link, setLink] = useState(initialLink);
  const [message, setMessage] = useState<ToastMessage | null>(() =>
    deriveInitialToast({ lineLinked, lineError, lineActive }),
  );

  // Strips ?lineLinked=../?lineError=../?active=.. from the URL once the
  // toast above has been rendered from them, so a refresh doesn't re-show
  // it. Only touches browser history directly -- never calls setState here.
  useEffect(() => {
    if (lineLinked || lineError) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [isTogglePending, setIsTogglePending] = useState(false);
  const [isUnlinkOpen, setIsUnlinkOpen] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const titleId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isUnlinkOpen) confirmButtonRef.current?.focus();
  }, [isUnlinkOpen]);

  const status = getLineLinkStatus(link);

  async function handleToggle(checked: boolean) {
    if (!link) return;
    const previous = link;
    setIsTogglePending(true);
    setLink({ ...link, isEnabled: checked });

    const supabase = createClient();
    const { error } = await setLineNotificationsEnabled(supabase, checked);
    setIsTogglePending(false);

    if (error) {
      console.error("[engineer-line-settings] failed to toggle LINE notifications:", error);
      setLink(previous);
      setMessage({ type: "error", text: ENGINEER_LINE_SETTINGS.errorToggleGeneric });
    }
  }

  async function handleUnlink() {
    if (isUnlinking) return;
    setUnlinkError(null);
    setIsUnlinking(true);

    const supabase = createClient();
    const { error } = await unlinkLineAccount(supabase);
    setIsUnlinking(false);

    if (error) {
      console.error("[engineer-line-settings] failed to unlink LINE account:", error);
      setUnlinkError(DIALOG.errorGeneric);
      return;
    }

    setLink(null);
    setIsUnlinkOpen(false);
  }

  return (
    <SectionCard title={ENGINEER_LINE_SETTINGS.title} description={ENGINEER_LINE_SETTINGS.description}>
      {status === "unlinked" && (
        <div className="flex flex-col gap-3">
          <a
            href="/auth/line/start"
            className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-[#06C755] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#05b34c] focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Link2 className="h-4 w-4" aria-hidden="true" />
            {UNLINKED.connectButtonLabel}
          </a>
          <p className="text-xs text-muted-foreground">{UNLINKED.note}</p>
        </div>
      )}

      {(status === "active" || status === "needs_friend") && link && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            {link.pictureUrl ? (
              <Image
                src={link.pictureUrl}
                alt={link.displayName ?? "LINE"}
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#06C755]/10 text-[#06C755]">
                <Link2 className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {link.displayName
                  ? ACTIVE.connectedAsLabel(link.displayName)
                  : ACTIVE.badgeLabel}
              </p>
              {status === "active" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {ACTIVE.badgeLabel}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                  <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  {NEEDS_FRIEND.badgeLabel}
                </span>
              )}
            </div>
          </div>

          {status === "needs_friend" && (
            <div className="flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">{NEEDS_FRIEND.message}</p>
              {LINE_ADD_FRIEND_URL && (
                <a
                  href={LINE_ADD_FRIEND_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-fit items-center justify-center rounded-xl bg-[#06C755] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#05b34c] focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {NEEDS_FRIEND.addFriendButtonLabel}
                </a>
              )}
            </div>
          )}

          {status === "active" && (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label htmlFor="line-notifications-enabled" className="text-foreground">
                  {ACTIVE.toggleLabel}
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">{ACTIVE.toggleDescription}</p>
              </div>
              <Switch
                id="line-notifications-enabled"
                checked={link.isEnabled}
                disabled={isTogglePending}
                onCheckedChange={(checked) => void handleToggle(checked)}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setUnlinkError(null);
              setIsUnlinkOpen(true);
            }}
            className="inline-flex h-9 w-fit items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Unlink2 className="h-4 w-4" aria-hidden="true" />
            {ENGINEER_LINE_SETTINGS.unlinkButtonLabel}
          </button>
        </div>
      )}

      {message && (
        <div
          className={`mt-5 flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
          role={message.type === "error" ? "alert" : "status"}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="メッセージを閉じる"
            className="shrink-0 rounded-lg p-1 transition-colors duration-200 hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {isUnlinkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={DIALOG.cancelLabel}
            onClick={() => !isUnlinking && setIsUnlinkOpen(false)}
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
              <div>
                <h2 id={titleId} className="text-base font-semibold text-foreground">
                  {DIALOG.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{DIALOG.description}</p>
              </div>
            </div>

            {unlinkError && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {unlinkError}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUnlinkOpen(false)}
                disabled={isUnlinking}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {DIALOG.cancelLabel}
              </button>
              <button
                type="button"
                ref={confirmButtonRef}
                onClick={() => void handleUnlink()}
                disabled={isUnlinking}
                aria-busy={isUnlinking}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUnlinking && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isUnlinking ? DIALOG.submittingLabel : DIALOG.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
