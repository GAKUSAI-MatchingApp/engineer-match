"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { createClient } from "@/lib/supabase/client";
import {
  addPortfolioProject,
  removePortfolioProject,
  setPortfolioProjectTechnologies,
  updatePortfolioProject,
  type PortfolioProjectInput,
  type PortfolioProjectItem,
} from "@/lib/engineer/portfolio";
import { PORTFOLIO_EDITOR_LABELS, PORTFOLIO_FORM_FIELDS } from "@/constants/engineer-profile";

interface RowForm {
  title: string;
  role: string;
  description: string;
  url: string;
  period: string;
  technologies: string;
}

const EMPTY_FORM: RowForm = { title: "", role: "", description: "", url: "", period: "", technologies: "" };

function toRowForm(item: PortfolioProjectItem): RowForm {
  return {
    title: item.title,
    role: item.role ?? "",
    description: item.description ?? "",
    url: item.url ?? "",
    period: item.period ?? "",
    technologies: item.technologies.join(", "),
  };
}

interface PortfolioManagerProps {
  userId: string;
  initialItems: PortfolioProjectItem[];
}

export function PortfolioManager({ userId, initialItems }: PortfolioManagerProps) {
  const [items, setItems] = useState<PortfolioProjectItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RowForm>(EMPTY_FORM);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<RowForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(item: PortfolioProjectItem) {
    setEditingId(item.id);
    setEditForm(toRowForm(item));
    setError(null);
  }

  async function handleAdd() {
    if (isSubmitting) return;
    if (!addForm.title.trim()) {
      setError(PORTFOLIO_EDITOR_LABELS.titleRequired);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const input: PortfolioProjectInput = {
      title: addForm.title.trim(),
      role: addForm.role.trim() || null,
      description: addForm.description.trim() || null,
      url: addForm.url.trim() || null,
      period: addForm.period.trim() || null,
      displayOrder: items.length,
    };
    const { data, error: addError } = await addPortfolioProject(supabase, userId, input);

    if (addError || !data) {
      console.error("[portfolio] add failed:", addError);
      setIsSubmitting(false);
      setError(PORTFOLIO_EDITOR_LABELS.addError);
      return;
    }

    const technologies = addForm.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (technologies.length > 0) {
      await setPortfolioProjectTechnologies(supabase, data.id as string, technologies);
    }

    setItems((prev) => [...prev, { id: data.id as string, ...input, technologies }]);
    setAddForm(EMPTY_FORM);
    setIsAdding(false);
    setIsSubmitting(false);
  }

  async function handleUpdate(id: string) {
    if (isSubmitting) return;
    if (!editForm.title.trim()) {
      setError(PORTFOLIO_EDITOR_LABELS.titleRequired);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const existing = items.find((item) => item.id === id);
    const input: PortfolioProjectInput = {
      title: editForm.title.trim(),
      role: editForm.role.trim() || null,
      description: editForm.description.trim() || null,
      url: editForm.url.trim() || null,
      period: editForm.period.trim() || null,
      displayOrder: existing?.displayOrder ?? 0,
    };
    const { error: updateError } = await updatePortfolioProject(supabase, id, input);

    if (updateError) {
      console.error("[portfolio] update failed:", updateError);
      setIsSubmitting(false);
      setError(PORTFOLIO_EDITOR_LABELS.updateError);
      return;
    }

    const technologies = editForm.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await setPortfolioProjectTechnologies(supabase, id, technologies);

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...input, technologies } : item)));
    setEditingId(null);
    setIsSubmitting(false);
  }

  async function handleRemove(id: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: removeError } = await removePortfolioProject(supabase, id);

    setIsSubmitting(false);

    if (removeError) {
      console.error("[portfolio] remove failed:", removeError);
      setError(PORTFOLIO_EDITOR_LABELS.removeError);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function renderFields(
    form: RowForm,
    onChange: (patch: Partial<RowForm>) => void,
    idPrefix: string,
  ) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-title`}>
              {PORTFOLIO_FORM_FIELDS.title}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idPrefix}-title`}
              type="text"
              value={form.title}
              onChange={(event) => onChange({ title: event.target.value })}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-role`}>{PORTFOLIO_FORM_FIELDS.role}</Label>
            <Input
              id={`${idPrefix}-role`}
              type="text"
              value={form.role}
              onChange={(event) => onChange({ role: event.target.value })}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-url`}>{PORTFOLIO_FORM_FIELDS.url}</Label>
            <Input
              id={`${idPrefix}-url`}
              type="url"
              value={form.url}
              onChange={(event) => onChange({ url: event.target.value })}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-period`}>{PORTFOLIO_FORM_FIELDS.period}</Label>
            <Input
              id={`${idPrefix}-period`}
              type="text"
              value={form.period}
              onChange={(event) => onChange({ period: event.target.value })}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-description`}>{PORTFOLIO_FORM_FIELDS.description}</Label>
          <Textarea
            id={`${idPrefix}-description`}
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-technologies`}>{PORTFOLIO_FORM_FIELDS.technologies}</Label>
          <Input
            id={`${idPrefix}-technologies`}
            type="text"
            value={form.technologies}
            onChange={(event) => onChange({ technologies: event.target.value })}
            className="h-9"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">{PORTFOLIO_EDITOR_LABELS.emptyMessage}</p>
      )}

      {items.map((item) =>
        editingId === item.id ? (
          <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border p-4">
            {renderFields(editForm, (patch) => setEditForm((prev) => ({ ...prev, ...patch })), `edit-pf-${item.id}`)}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdate(item.id)}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
                {PORTFOLIO_EDITOR_LABELS.saveLabel}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
              >
                {PORTFOLIO_EDITOR_LABELS.cancelLabel}
              </button>
            </div>
          </div>
        ) : (
          <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {item.role && <p className="mt-0.5 text-xs font-medium text-primary">{item.role}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  aria-label={`編集：${item.title}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isSubmitting}
                  aria-label={`${PORTFOLIO_EDITOR_LABELS.removeLabel}：${item.title}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            {item.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            )}
            {item.technologies.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {item.technologies.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {item.period && <span>{item.period}</span>}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  {item.url}
                </a>
              )}
            </div>
          </div>
        ),
      )}

      {isAdding ? (
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border p-4">
          {renderFields(addForm, (patch) => setAddForm((prev) => ({ ...prev, ...patch })), "add-pf")}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {PORTFOLIO_EDITOR_LABELS.addLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setAddForm(EMPTY_FORM);
                setError(null);
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {PORTFOLIO_EDITOR_LABELS.cancelLabel}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-primary/5"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {PORTFOLIO_EDITOR_LABELS.addLabel}
        </button>
      )}

      <FormStatusMessage message={error} status={error ? "error" : null} />
    </div>
  );
}
