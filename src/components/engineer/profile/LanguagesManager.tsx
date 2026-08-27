"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { createClient } from "@/lib/supabase/client";
import {
  addLanguage,
  removeLanguage,
  updateLanguageLevel,
  type LanguageItem,
  type LanguageLevel,
} from "@/lib/engineer/languages";
import {
  LANGUAGE_EDITOR_LABELS,
  LANGUAGE_LEVEL_OPTIONS,
  LANGUAGE_NAME_SUGGESTIONS,
} from "@/constants/engineer-profile";

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface LanguagesManagerProps {
  userId: string;
  initialItems: LanguageItem[];
}

export function LanguagesManager({ userId, initialItems }: LanguagesManagerProps) {
  const [items, setItems] = useState<LanguageItem[]>(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState<LanguageLevel>(LANGUAGE_LEVEL_OPTIONS[0].value);

  async function handleAdd() {
    if (isSubmitting || !newName.trim()) return;
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: addError } = await addLanguage(supabase, userId, newName.trim(), newLevel);

    setIsSubmitting(false);

    if (addError || !data) {
      console.error("[languages] add failed:", addError);
      setError(LANGUAGE_EDITOR_LABELS.addError);
      return;
    }

    setItems((prev) => [
      ...prev,
      { id: data.id as string, languageName: newName.trim(), level: newLevel, displayOrder: prev.length },
    ]);
    setNewName("");
    setNewLevel(LANGUAGE_LEVEL_OPTIONS[0].value);
  }

  async function handleLevelChange(id: string, level: LanguageLevel) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await updateLanguageLevel(supabase, id, level);

    setIsSubmitting(false);

    if (updateError) {
      console.error("[languages] level update failed:", updateError);
      setError(LANGUAGE_EDITOR_LABELS.updateError);
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, level } : item)));
  }

  async function handleRemove(id: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: removeError } = await removeLanguage(supabase, id);

    setIsSubmitting(false);

    if (removeError) {
      console.error("[languages] remove failed:", removeError);
      setError(LANGUAGE_EDITOR_LABELS.removeError);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">{LANGUAGE_EDITOR_LABELS.emptyMessage}</p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-3"
        >
          <div className="min-w-40 flex-1">
            <p className="text-sm font-semibold text-foreground">{item.languageName}</p>
          </div>
          <div className="flex w-48 flex-col gap-1.5">
            <Label htmlFor={`lang-level-${item.id}`} className="sr-only">
              {LANGUAGE_EDITOR_LABELS.levelLabel}
            </Label>
            <select
              id={`lang-level-${item.id}`}
              value={item.level}
              disabled={isSubmitting}
              onChange={(event) => handleLevelChange(item.id, event.target.value as LanguageLevel)}
              className={SELECT_CLASS}
            >
              {LANGUAGE_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => handleRemove(item.id)}
            disabled={isSubmitting}
            aria-label={`${LANGUAGE_EDITOR_LABELS.removeLabel}：${item.languageName}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border p-3">
        <div className="min-w-40 flex-1 flex-col gap-1.5">
          <Label htmlFor="new-lang-name">
            {LANGUAGE_EDITOR_LABELS.languageLabel}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="new-lang-name"
            type="text"
            list="language-name-suggestions"
            value={newName}
            placeholder={LANGUAGE_EDITOR_LABELS.languageNamePlaceholder}
            onChange={(event) => setNewName(event.target.value)}
            className="h-9"
          />
          <datalist id="language-name-suggestions">
            {LANGUAGE_NAME_SUGGESTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div className="flex w-48 flex-col gap-1.5">
          <Label htmlFor="new-lang-level">{LANGUAGE_EDITOR_LABELS.levelLabel}</Label>
          <select
            id="new-lang-level"
            value={newLevel}
            onChange={(event) => setNewLevel(event.target.value as LanguageLevel)}
            className={SELECT_CLASS}
          >
            {LANGUAGE_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isSubmitting || !newName.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {LANGUAGE_EDITOR_LABELS.addLabel}
        </button>
      </div>

      <FormStatusMessage message={error} status={error ? "error" : null} />
    </div>
  );
}
