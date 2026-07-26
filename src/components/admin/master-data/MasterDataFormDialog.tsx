"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { MASTER_DATA_FORM_LABELS as LABELS, type MasterDataTabKey } from "@/constants/admin-master-data";
import type { AdminMasterDataOption } from "@/lib/admin/master-data";

export interface MasterDataFormValues {
  name: string;
  description: string;
  organization: string;
  category: string;
  categoryId: string;
  subcategoryId: string;
}

interface MasterDataFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  tab: MasterDataTabKey;
  initial?: Partial<MasterDataFormValues>;
  levelLabel?: string;
  categoryOptions: AdminMasterDataOption[];
  subcategoryOptions: (AdminMasterDataOption & { categoryId: string })[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSave: (values: MasterDataFormValues) => void;
}

const INPUT_CLASS =
  "h-10 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary";

export function MasterDataFormDialog({
  isOpen,
  mode,
  tab,
  initial,
  levelLabel,
  categoryOptions,
  subcategoryOptions,
  isSubmitting,
  errorMessage,
  onCancel,
  onSave,
}: MasterDataFormDialogProps) {
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [organization, setOrganization] = useState(initial?.organization ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categoryOptions[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(
    initial?.subcategoryId ?? subcategoryOptions[0]?.id ?? "",
  );

  // Form field state is intentionally only initialized from `initial` above,
  // not re-synced in an effect: the parent remounts this component (via a
  // `key` keyed to the open dialog's identity) whenever a different item or
  // mode is opened, so a fresh mount already has the right initial values.
  useEffect(() => {
    if (!isOpen) return;
    firstFieldRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const filteredSubcategoryOptions = subcategoryOptions.filter((s) => s.categoryId === categoryId);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ name, description, organization, category, categoryId, subcategoryId });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label={LABELS.cancelLabel} onClick={onCancel} className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-full max-w-md flex-col gap-5 rounded-2xl bg-surface p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-foreground">
          {mode === "add" ? LABELS.addTitle : LABELS.editTitle}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {levelLabel && (
            <p className="text-sm font-medium text-muted-foreground">{levelLabel}</p>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="master-data-name" className="text-sm font-medium text-foreground">
              {LABELS.nameLabel}
            </label>
            <input
              id="master-data-name"
              ref={firstFieldRef}
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          {tab === "skillSubcategories" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="master-data-category" className="text-sm font-medium text-foreground">
                {LABELS.parentCategoryLabel}
              </label>
              <select
                id="master-data-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className={INPUT_CLASS}
              >
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tab === "skills" && (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="master-data-subcategory" className="text-sm font-medium text-foreground">
                  {LABELS.parentSubcategoryLabel}
                </label>
                <select
                  id="master-data-subcategory"
                  value={subcategoryId}
                  onChange={(event) => setSubcategoryId(event.target.value)}
                  className={INPUT_CLASS}
                >
                  {filteredSubcategoryOptions.length > 0
                    ? filteredSubcategoryOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))
                    : subcategoryOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="master-data-description" className="text-sm font-medium text-foreground">
                  {LABELS.descriptionLabel}
                </label>
                <textarea
                  id="master-data-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </>
          )}

          {tab === "skillLevels" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="master-data-description" className="text-sm font-medium text-foreground">
                {LABELS.descriptionLabel}
              </label>
              <textarea
                id="master-data-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          )}

          {tab === "qualifications" && (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="master-data-organization" className="text-sm font-medium text-foreground">
                  {LABELS.organizationLabel}
                </label>
                <input
                  id="master-data-organization"
                  type="text"
                  required
                  maxLength={100}
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="master-data-qual-category" className="text-sm font-medium text-foreground">
                  {LABELS.categoryLabel}
                </label>
                <input
                  id="master-data-qual-category"
                  type="text"
                  maxLength={50}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </>
          )}

          {errorMessage && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {LABELS.cancelLabel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {LABELS.saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
