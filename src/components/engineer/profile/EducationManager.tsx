"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { createClient } from "@/lib/supabase/client";
import {
  addEducation,
  removeEducation,
  updateEducation,
  type EducationInput,
  type EducationItem,
} from "@/lib/engineer/education";
import { EDUCATION_EDITOR_LABELS, EDUCATION_FORM_FIELDS } from "@/constants/engineer-profile";

interface RowForm {
  schoolName: string;
  department: string;
  period: string;
  description: string;
}

const EMPTY_FORM: RowForm = { schoolName: "", department: "", period: "", description: "" };

function toRowForm(item: EducationItem): RowForm {
  return {
    schoolName: item.schoolName,
    department: item.department ?? "",
    period: item.period ?? "",
    description: item.description ?? "",
  };
}

interface EducationManagerProps {
  userId: string;
  initialItems: EducationItem[];
}

export function EducationManager({ userId, initialItems }: EducationManagerProps) {
  const [items, setItems] = useState<EducationItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RowForm>(EMPTY_FORM);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<RowForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(item: EducationItem) {
    setEditingId(item.id);
    setEditForm(toRowForm(item));
    setError(null);
  }

  async function handleAdd() {
    if (isSubmitting) return;
    if (!addForm.schoolName.trim()) {
      setError(EDUCATION_EDITOR_LABELS.schoolNameRequired);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const input: EducationInput = {
      schoolName: addForm.schoolName.trim(),
      department: addForm.department.trim() || null,
      period: addForm.period.trim() || null,
      description: addForm.description.trim() || null,
      displayOrder: items.length,
    };
    const { data, error: addError } = await addEducation(supabase, userId, input);

    setIsSubmitting(false);

    if (addError || !data) {
      console.error("[education] add failed:", addError);
      setError(EDUCATION_EDITOR_LABELS.addError);
      return;
    }

    setItems((prev) => [...prev, { id: data.id as string, ...input }]);
    setAddForm(EMPTY_FORM);
    setIsAdding(false);
  }

  async function handleUpdate(id: string) {
    if (isSubmitting) return;
    if (!editForm.schoolName.trim()) {
      setError(EDUCATION_EDITOR_LABELS.schoolNameRequired);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const existing = items.find((item) => item.id === id);
    const input: EducationInput = {
      schoolName: editForm.schoolName.trim(),
      department: editForm.department.trim() || null,
      period: editForm.period.trim() || null,
      description: editForm.description.trim() || null,
      displayOrder: existing?.displayOrder ?? 0,
    };
    const { error: updateError } = await updateEducation(supabase, id, input);

    setIsSubmitting(false);

    if (updateError) {
      console.error("[education] update failed:", updateError);
      setError(EDUCATION_EDITOR_LABELS.updateError);
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...input } : item)));
    setEditingId(null);
  }

  async function handleRemove(id: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: removeError } = await removeEducation(supabase, id);

    setIsSubmitting(false);

    if (removeError) {
      console.error("[education] remove failed:", removeError);
      setError(EDUCATION_EDITOR_LABELS.removeError);
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
            <Label htmlFor={`${idPrefix}-school`}>
              {EDUCATION_FORM_FIELDS.schoolName}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idPrefix}-school`}
              type="text"
              value={form.schoolName}
              onChange={(event) => onChange({ schoolName: event.target.value })}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-department`}>{EDUCATION_FORM_FIELDS.department}</Label>
            <Input
              id={`${idPrefix}-department`}
              type="text"
              value={form.department}
              onChange={(event) => onChange({ department: event.target.value })}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-period`}>{EDUCATION_FORM_FIELDS.period}</Label>
            <Input
              id={`${idPrefix}-period`}
              type="text"
              value={form.period}
              placeholder="2014年4月 - 2018年3月"
              onChange={(event) => onChange({ period: event.target.value })}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-description`}>{EDUCATION_FORM_FIELDS.description}</Label>
          <Textarea
            id={`${idPrefix}-description`}
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
            rows={3}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">{EDUCATION_EDITOR_LABELS.emptyMessage}</p>
      )}

      {items.map((item) =>
        editingId === item.id ? (
          <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border p-4">
            {renderFields(editForm, (patch) => setEditForm((prev) => ({ ...prev, ...patch })), `edit-edu-${item.id}`)}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdate(item.id)}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
                {EDUCATION_EDITOR_LABELS.saveLabel}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
              >
                {EDUCATION_EDITOR_LABELS.cancelLabel}
              </button>
            </div>
          </div>
        ) : (
          <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.schoolName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[item.department, item.period].filter(Boolean).join(" ・ ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  aria-label={`編集：${item.schoolName}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isSubmitting}
                  aria-label={`${EDUCATION_EDITOR_LABELS.removeLabel}：${item.schoolName}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            {item.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            )}
          </div>
        ),
      )}

      {isAdding ? (
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border p-4">
          {renderFields(addForm, (patch) => setAddForm((prev) => ({ ...prev, ...patch })), "add-edu")}
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
              {EDUCATION_EDITOR_LABELS.addLabel}
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
              {EDUCATION_EDITOR_LABELS.cancelLabel}
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
          {EDUCATION_EDITOR_LABELS.addLabel}
        </button>
      )}

      <FormStatusMessage message={error} status={error ? "error" : null} />
    </div>
  );
}
