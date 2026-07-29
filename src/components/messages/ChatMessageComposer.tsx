"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const MESSAGE_MAX_LENGTH = 2000;

interface ChatMessageComposerLabels {
  placeholder: string;
  sendLabel: string;
  sendingLabel: string;
  sendError: string;
  keyboardHint: string;
}

interface ChatMessageComposerProps {
  inputId: string;
  labels: ChatMessageComposerLabels;
  onSend: (content: string) => Promise<boolean>;
}

export function ChatMessageComposer({
  inputId,
  labels,
  onSend,
}: ChatMessageComposerProps) {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(false);
  const sendLockRef = useRef(false);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sendLockRef.current) return;

    sendLockRef.current = true;
    setIsSending(true);
    setError(false);
    try {
      const ok = await onSend(trimmed);
      if (ok) {
        setValue("");
      } else {
        setError(true);
      }
    } catch (sendError) {
      console.error("[chat-composer] unexpected send failure:", sendError);
      setError(true);
    } finally {
      sendLockRef.current = false;
      setIsSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="shrink-0 border-t border-border bg-surface px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex min-w-0 items-end gap-2">
        <label htmlFor={inputId} className="sr-only">
          {labels.placeholder}
        </label>
        <Textarea
          id={inputId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={labels.placeholder}
          rows={1}
          maxLength={MESSAGE_MAX_LENGTH}
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-xl py-2.5"
          disabled={isSending}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={value.trim() === "" || isSending}
          className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
        >
          {isSending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {isSending ? labels.sendingLabel : labels.sendLabel}
          </span>
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 px-1 text-[11px] text-muted-foreground">
        <span>{labels.keyboardHint}</span>
        <span className="shrink-0">
          {value.length}/{MESSAGE_MAX_LENGTH}
        </span>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {labels.sendError}
        </p>
      )}
    </div>
  );
}
