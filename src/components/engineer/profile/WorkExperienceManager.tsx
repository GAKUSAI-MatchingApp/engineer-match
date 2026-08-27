"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { createClient } from "@/lib/supabase/client";
import {
  addWorkExperience,
  removeWorkExperience,
  setWorkExperienceTechnologies,
  updateWorkExperience,
  type EmploymentType,
  type WorkExperienceInput,
  type WorkExperienceItem,
} from "@/lib/engineer/work-experience";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_EXPERIENCE_EDITOR_LABELS,
  WORK_EXPERIENCE_FORM_FIELDS,
} from "@/constants/engineer-profile";

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface RowForm {
  companyName: string;
  position: string;
  period: string;
  employmentType: string;
  summary: string;
  technologies: string;
}

const EMPTY_FORM: RowForm = {
  companyName: "",
  position: "",
  period: "",
  employmentType: "",
  summary: "",
  technologies: "",
};

function toRowForm(item: WorkExperienceItem): RowForm {
  return {
    companyName: item.companyName,
    position: item.position ?? "",
    period: item.period ?? "",
    employmentType: item.employmentType ?? "",
    summary: item.summary ?? "",
    technologies: item.technologies.join(", "),
  };
}

interface WorkExperienceManagerProps {
  userId: string;
  initialItems: WorkExperienceItem[];
}

export function WorkExperienceManager({ userId, initialItems }: WorkExperienceManagerProps) {
  const [items, setItems] = useState<WorkExperienceItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RowForm>(EMPTY_FORM);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<RowForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(item: WorkExperienceItem) {
    setEditingId(item.id);
    setEditForm(toRowForm(item));
    setError(null);
  }

  async function handleAdd() {
    if (isSubmitting) return;
    if (!addForm.companyName.trim()) {
      setError(WORK_EXPERIENCE_EDITOR_LABELS.companyNameRequired);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const input: WorkExperienceInput = {
      companyName: addForm.companyName.trim(),
      position: addForm.position.trim() || null,
      period: addForm.period.trim() || null,
      employmentType: (addForm.employmentType || null) as EmploymentType | null,
      summary: addForm.summary.trim() || null,
      displayOrder: items.length,
    };
    const { data, error: addError } = await addWorkExperience(supabase, userId, input);

    if (addError || !data) {
      console.error("[work-experience] add failed:", addError);
      setIsSubmitting(false);
      setError(WORK_EXPERIENCE_EDITOR_LABELS.addError);
      return;
    }

    const technologies = addForm.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (technologies.length > 0) {
      await setWorkExperienceTechnologies(supabase, data.id as string, technologies);
    }

    setItems((prev) => [
      ...prev,
      {
        id: data.id as string,
        companyName: input.companyName,
        position: input.position,
        period: input.period,
        employmentType: input.employmentType,
        summary: input.summary,
        displayOrder: input.displayOrder,
        technologies,
      },
    ]);
    setAddForm(EMPTY_FORM);
    setIsAdding(false);
    setIsSubmitting(false);
  }

  async function handleUpdate(id: string) {
    if (isSubmitting) return;
    if (!editForm.companyName.trim()) {
      setError(WORK_EXPERIENCE_EDITOR_LABELS.companyNameRequired);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const existing = items.find((item) => item.id === id);
    const input: WorkExperienceInput = {
      companyName: editForm.companyName.trim(),
      position: editForm.position.trim() || null,
      period: editForm.period.trim() || null,
      employmentType: (editForm.employmentType || null) as EmploymentType | null,
      summary: editForm.summary.trim() || null,
      displayOrder: existing?.displayOrder ?? 0,
    };
    const { error: updateError } = await updateWorkExperience(supabase, id, input);

    if (updateError) {
      console.error("[work-experience] update failed:", updateError);
      setIsSubmitting(false);
      setError(WORK_EXPERIENCE_EDITOR_LABELS.updateError);
      return;
    }

    const technologies = editForm.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await setWorkExperienceTechnologies(supabase, id, technologies);

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...input, technologies } : item)),
    );
    setEditingId(null);
    setIsSubmitting(false);
  }

  async function handleRemove(id: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: removeError } = await removeWorkExperience(supabase, id);

    setIsSubmitting(false);

    if (removeError) {
      console.error("[work-experience] remove failed:", removeError);
      setError(WORK_EXPERIENCE_EDITOR_LABELS.removeError);
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
            <Label htmlFor={`${idPrefix}-company`}>
              {WORK_EXPERIENCE_FORM_FIELDS.companyName}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idPrefix}-company`}
              type="text"
              value={form.companyName}
              onChange={(event) => onChange({ companyName: event.target.value })}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-position`}>{WORK_EXPERIENCE_FORM_FIELDS.position}</Label>
            <Input
              id={`${idPrefix}-position`}
              type="text"
              value={form.position}
              onChange={(event) => onChange({ position: event.target.value })}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-period`}>{WORK_EXPERIENCE_FORM_FIELDS.period}</Label>
            <Input
              id={`${idPrefix}-period`}
              type="text"
              value={form.period}
              placeholder="2022年4月 - 現在"
              onChange={(event) => onChange({ period: event.target.value })}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-employment-type`}>
              {WORK_EXPERIENCE_FORM_FIELDS.employmentType}
            </Label>
            <select
              id={`${idPrefix}-employment-type`}
              value={form.employmentType}
              onChange={(event) => onChange({ employmentType: event.target.value })}
              className={SELECT_CLASS}
            >
              <option value="">選択してください</option>
              {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-summary`}>{WORK_EXPERIENCE_FORM_FIELDS.summary}</Label>
          <Textarea
            id={`${idPrefix}-summary`}
            value={form.summary}
            onChange={(event) => onChange({ summary: event.target.value })}
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-technologies`}>{WORK_EXPERIENCE_FORM_FIELDS.technologies}</Label>
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
        <p className="text-sm text-muted-foreground">{WORK_EXPERIENCE_EDITOR_LABELS.emptyMessage}</p>
      )}

      {items.map((item) =>
        editingId === item.id ? (
          <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border p-4">
            {renderFields(editForm, (patch) => setEditForm((prev) => ({ ...prev, ...patch })), `edit-exp-${item.id}`)}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdate(item.id)}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
                {WORK_EXPERIENCE_EDITOR_LABELS.saveLabel}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
              >
                {WORK_EXPERIENCE_EDITOR_LABELS.cancelLabel}
              </button>
            </div>
          </div>
        ) : (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-xl border border-border p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.companyName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[item.position, item.period].filter(Boolean).join(" ・ ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  aria-label={`編集：${item.companyName}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isSubmitting}
                  aria-label={`${WORK_EXPERIENCE_EDITOR_LABELS.removeLabel}：${item.companyName}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            {item.summary && (
              <p className="text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
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
          </div>
        ),
      )}

      {isAdding ? (
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border p-4">
          {renderFields(addForm, (patch) => setAddForm((prev) => ({ ...prev, ...patch })), "add-exp")}
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
              {WORK_EXPERIENCE_EDITOR_LABELS.addLabel}
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
              {WORK_EXPERIENCE_EDITOR_LABELS.cancelLabel}
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
          {WORK_EXPERIENCE_EDITOR_LABELS.addLabel}
        </button>
      )}

      <FormStatusMessage message={error} status={error ? "error" : null} />
    </div>
  );
}
