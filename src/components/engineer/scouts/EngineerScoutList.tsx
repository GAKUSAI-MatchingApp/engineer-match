"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import {
  ENGINEER_SCOUT_CARD_LABELS,
  ENGINEER_SCOUT_EMPTY_STATE_LABELS,
  ENGINEER_SCOUT_STATUS_LABELS,
  ENGINEER_SCOUT_STATUS_STYLES,
} from "@/constants/engineer-scouts";
import { formatDateJa } from "@/lib/engineer/format";
import { createClient } from "@/lib/supabase/client";
import { respondToScout, mapScoutError, type ScoutListItem } from "@/lib/engineer/scouts";

interface EngineerScoutListProps {
  initialScouts: ScoutListItem[];
}

export function EngineerScoutList({ initialScouts }: EngineerScoutListProps) {
  const router = useRouter();
  const [scouts, setScouts] = useState(initialScouts);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  async function handleRespond(scoutId: string, response: "accepted" | "declined") {
    if (respondingId) return;
    setRespondingId(scoutId);
    setErrorById((previous) => ({ ...previous, [scoutId]: "" }));

    try {
      const supabase = createClient();
      const { chatRoomId, error } = await respondToScout(supabase, scoutId, response);

      if (error) {
        console.error("[engineer-scouts] respond failed:", error);
        setErrorById((previous) => ({ ...previous, [scoutId]: mapScoutError(error) }));
        return;
      }

      setScouts((previous) =>
        previous.map((scout) =>
          scout.id === scoutId
            ? { ...scout, status: response, respondedAt: new Date().toISOString(), chatRoomId }
            : scout,
        ),
      );
      router.refresh();
    } catch (err) {
      console.error("[engineer-scouts] unexpected respond error:", err);
      setErrorById((previous) => ({ ...previous, [scoutId]: ENGINEER_SCOUT_CARD_LABELS.errorGeneric }));
    } finally {
      setRespondingId(null);
    }
  }

  if (scouts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-foreground">{ENGINEER_SCOUT_EMPTY_STATE_LABELS.title}</p>
        <p className="text-sm text-muted-foreground">{ENGINEER_SCOUT_EMPTY_STATE_LABELS.description}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {scouts.map((scout) => {
        const isResponding = respondingId === scout.id;
        return (
          <li
            key={scout.id}
            id={`scout-${scout.id}`}
            className="scroll-mt-24 rounded-2xl border border-border bg-surface p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{ENGINEER_SCOUT_CARD_LABELS.fromLabel}</p>
                <p className="text-sm font-semibold text-foreground">{scout.companyName}</p>
                {scout.opportunityTitle && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ENGINEER_SCOUT_CARD_LABELS.opportunityLabel}: {scout.opportunityTitle}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ENGINEER_SCOUT_STATUS_STYLES[scout.status]}`}
              >
                {ENGINEER_SCOUT_STATUS_LABELS[scout.status]}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-foreground">{scout.message}</p>

            <p className="mt-3 text-xs text-muted-foreground">
              {ENGINEER_SCOUT_CARD_LABELS.receivedAtPrefix}
              {formatDateJa(scout.createdAt)}
            </p>

            <FormStatusMessage message={errorById[scout.id] || null} status="error" className="mt-3" />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {scout.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleRespond(scout.id, "accepted")}
                    disabled={isResponding}
                    aria-busy={isResponding}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResponding && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {isResponding ? ENGINEER_SCOUT_CARD_LABELS.respondingLabel : ENGINEER_SCOUT_CARD_LABELS.acceptLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRespond(scout.id, "declined")}
                    disabled={isResponding}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ENGINEER_SCOUT_CARD_LABELS.declineLabel}
                  </button>
                </>
              )}
              {scout.status === "accepted" && scout.chatRoomId && (
                <Link
                  href={`/messages/scout/${scout.id}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {ENGINEER_SCOUT_CARD_LABELS.chatButtonLabel}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
