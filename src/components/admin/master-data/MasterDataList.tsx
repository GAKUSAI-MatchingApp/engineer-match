"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { MasterDataTabs } from "@/components/admin/master-data/MasterDataTabs";
import { MasterDataTable } from "@/components/admin/master-data/MasterDataTable";
import { MasterDataMobileCards } from "@/components/admin/master-data/MasterDataMobileCards";
import type { MasterDataFormValues } from "@/components/admin/master-data/MasterDataFormDialog";
import { AdminSearchInput } from "@/components/admin/shared/AdminSearchInput";
import { AdminEmptyState } from "@/components/admin/shared/AdminEmptyState";
import {
  MASTER_DATA_ERROR_FALLBACK,
  MASTER_DATA_LABELS,
  MASTER_DATA_TOAST_MESSAGES,
  type MasterDataTabKey,
} from "@/constants/admin-master-data";
import {
  createIndustryCategory,
  createQualification,
  createSkill,
  createSkillSubcategory,
  setIndustryCategoryActive,
  setQualificationActive,
  setSkillActive,
  setSkillCategoryActive,
  setSkillSubcategoryActive,
  updateIndustryCategory,
  updateQualification,
  updateSkill,
  updateSkillCategory,
  updateSkillLevel,
  updateSkillSubcategory,
  type AdminMasterData,
  type AdminMasterDataItem,
} from "@/lib/admin/master-data";
import { createClient } from "@/lib/supabase/client";

// Deferred: only ever needed after the admin clicks "add"/"edit", not on
// initial page load.
const MasterDataFormDialog = dynamic(() =>
  import("@/components/admin/master-data/MasterDataFormDialog").then(
    (mod) => mod.MasterDataFormDialog,
  ),
);

interface MasterDataListProps {
  data: AdminMasterData;
}

const ADDABLE_TABS: MasterDataTabKey[] = ["skills", "skillSubcategories", "qualifications", "industries"];
const TOGGLEABLE_TABS: MasterDataTabKey[] = [
  "skills",
  "skillSubcategories",
  "skillCategories",
  "qualifications",
  "industries",
];

export function MasterDataList({ data: initialData }: MasterDataListProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<MasterDataTabKey>("skills");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [formDialog, setFormDialog] = useState<{ mode: "add" | "edit"; item?: AdminMasterDataItem } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  const items = data[activeTab];
  const canAdd = ADDABLE_TABS.includes(activeTab);
  const canToggleActive = TOGGLEABLE_TABS.includes(activeTab);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (activeOnly && !item.active) return false;
      if (!query) return true;
      return item.displayName.toLowerCase().includes(query);
    });
  }, [items, searchQuery, activeOnly]);

  function updateItemInState(id: string, patch: Partial<AdminMasterDataItem>) {
    setData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  async function handleToggleActive(item: AdminMasterDataItem) {
    const supabase = createClient();
    const nextActive = !item.active;
    let result: { error: string | null };

    if (activeTab === "skills") result = await setSkillActive(supabase, item.id, nextActive);
    else if (activeTab === "skillSubcategories") result = await setSkillSubcategoryActive(supabase, item.id, nextActive);
    else if (activeTab === "skillCategories") result = await setSkillCategoryActive(supabase, item.id, nextActive);
    else if (activeTab === "industries") result = await setIndustryCategoryActive(supabase, item.id, nextActive);
    else result = await setQualificationActive(supabase, item.id, nextActive);

    if (result.error) {
      showToast(result.error);
      return;
    }
    updateItemInState(item.id, { active: nextActive });
    showToast(nextActive ? MASTER_DATA_TOAST_MESSAGES.enabled : MASTER_DATA_TOAST_MESSAGES.disabled);
  }

  function closeFormDialog() {
    setFormDialog(null);
    setErrorMessage(null);
  }

  function categoryName(categoryId: string): string {
    return data.categoryOptions.find((c) => c.id === categoryId)?.name ?? "";
  }
  function subcategoryContext(subcategoryId: string): string {
    const sub = data.subcategoryOptions.find((s) => s.id === subcategoryId);
    if (!sub) return "";
    return [categoryName(sub.categoryId), sub.name].filter(Boolean).join(" / ");
  }

  async function handleSaveForm(values: MasterDataFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);
    const supabase = createClient();
    const isEdit = formDialog?.mode === "edit" && formDialog.item;

    let error: string | null = null;
    let createdId: string | null = null;

    if (activeTab === "skills") {
      if (isEdit) {
        error = (await updateSkill(supabase, formDialog!.item!.id, values.subcategoryId, values.name, values.description))
          .error;
      } else {
        const result = await createSkill(supabase, values.subcategoryId, values.name, values.description);
        error = result.error;
        createdId = result.id;
      }
    } else if (activeTab === "skillSubcategories") {
      if (isEdit) {
        error = (await updateSkillSubcategory(supabase, formDialog!.item!.id, values.categoryId, values.name)).error;
      } else {
        const result = await createSkillSubcategory(supabase, values.categoryId, values.name);
        error = result.error;
        createdId = result.id;
      }
    } else if (activeTab === "skillCategories") {
      if (formDialog?.item) {
        error = (await updateSkillCategory(supabase, formDialog.item.id, values.name)).error;
      } else {
        error = "スキルカテゴリの追加はサポートされていません。";
      }
    } else if (activeTab === "qualifications") {
      if (isEdit) {
        error = (
          await updateQualification(supabase, formDialog!.item!.id, values.name, values.organization, values.category)
        ).error;
      } else {
        const result = await createQualification(supabase, values.name, values.organization, values.category);
        error = result.error;
        createdId = result.id;
      }
    } else if (activeTab === "industries") {
      if (isEdit) {
        error = (await updateIndustryCategory(supabase, formDialog!.item!.id, values.name)).error;
      } else {
        const result = await createIndustryCategory(supabase, values.name);
        error = result.error;
        createdId = result.id;
      }
    } else {
      if (formDialog?.item) {
        error = (await updateSkillLevel(supabase, Number(formDialog.item.id), values.name, values.description)).error;
      } else {
        error = "ITSSレベルの追加はサポートされていません。";
      }
    }

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error || MASTER_DATA_ERROR_FALLBACK);
      return;
    }

    if (isEdit) {
      const context =
        activeTab === "skills"
          ? subcategoryContext(values.subcategoryId)
          : activeTab === "skillSubcategories"
            ? categoryName(values.categoryId)
            : activeTab === "qualifications"
              ? [values.organization, values.category].filter(Boolean).join(" / ")
              : formDialog!.item!.context;
      updateItemInState(formDialog!.item!.id, {
        displayName: values.name,
        description: activeTab === "skills" || activeTab === "skillLevels" ? values.description || null : null,
        context,
        organization: activeTab === "qualifications" ? values.organization : null,
        categoryText: activeTab === "qualifications" ? values.category : null,
        parentId:
          activeTab === "skills" ? values.subcategoryId : activeTab === "skillSubcategories" ? values.categoryId : null,
      });
    } else if (createdId) {
      const context =
        activeTab === "skills"
          ? subcategoryContext(values.subcategoryId)
          : activeTab === "skillSubcategories"
            ? categoryName(values.categoryId)
            : [values.organization, values.category].filter(Boolean).join(" / ");
      const newItem: AdminMasterDataItem = {
        id: createdId,
        displayName: values.name,
        context,
        description: activeTab === "skills" ? values.description || null : null,
        sortOrder: items.length + 1,
        active: true,
        usageCount: 0,
        parentId:
          activeTab === "skills" ? values.subcategoryId : activeTab === "skillSubcategories" ? values.categoryId : null,
        organization: activeTab === "qualifications" ? values.organization : null,
        categoryText: activeTab === "qualifications" ? values.category : null,
      };
      setData((prev) => ({
        ...prev,
        [activeTab]: [...prev[activeTab], newItem],
        ...(activeTab === "skillSubcategories"
          ? {
              subcategoryOptions: [
                ...prev.subcategoryOptions,
                { id: createdId, name: values.name, categoryId: values.categoryId },
              ],
            }
          : {}),
      }));
    }

    showToast(isEdit ? MASTER_DATA_TOAST_MESSAGES.updated : MASTER_DATA_TOAST_MESSAGES.created);
    setFormDialog(null);
  }

  function handleResetFilters() {
    setSearchQuery("");
    setActiveOnly(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <MasterDataTabs
        active={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
          setActiveOnly(false);
        }}
      />

      <div id="master-data-panel" role="tabpanel" aria-labelledby={`master-data-tab-${activeTab}`}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <AdminSearchInput
                id="master-data-search"
                label={MASTER_DATA_LABELS.searchLabel}
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={MASTER_DATA_LABELS.searchPlaceholder}
              />
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(event) => setActiveOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary"
                />
                {MASTER_DATA_LABELS.activeOnlyLabel}
              </label>
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={() => setFormDialog({ mode: "add" })}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {MASTER_DATA_LABELS.addLabel}
              </button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {filteredItems.length}
            {MASTER_DATA_LABELS.resultsSuffix}
          </p>

          {filteredItems.length === 0 ? (
            <AdminEmptyState
              title="条件に一致するマスタデータが見つかりませんでした。"
              description="検索キーワードや絞り込み条件を変更してお試しください。"
              action={{ label: "条件をリセット", onClick: handleResetFilters }}
            />
          ) : (
            <>
              <MasterDataTable
                items={filteredItems}
                canToggleActive={canToggleActive}
                onEdit={(item) => setFormDialog({ mode: "edit", item })}
                onToggleActive={handleToggleActive}
              />
              <MasterDataMobileCards
                items={filteredItems}
                canToggleActive={canToggleActive}
                onEdit={(item) => setFormDialog({ mode: "edit", item })}
                onToggleActive={handleToggleActive}
              />
            </>
          )}
        </div>
      </div>

      <MasterDataFormDialog
        key={formDialog ? `${activeTab}-${formDialog.mode}-${formDialog.item?.id ?? "new"}` : "closed"}
        isOpen={formDialog !== null}
        mode={formDialog?.mode ?? "add"}
        tab={activeTab}
        initial={
          formDialog?.item
            ? {
                name: formDialog.item.displayName,
                description: formDialog.item.description ?? "",
                organization: formDialog.item.organization ?? "",
                category: formDialog.item.categoryText ?? "",
                categoryId:
                  activeTab === "skillSubcategories"
                    ? (formDialog.item.parentId ?? "")
                    : activeTab === "skills"
                      ? (data.subcategoryOptions.find((option) => option.id === formDialog.item!.parentId)?.categoryId ??
                        data.categoryOptions[0]?.id ??
                        "")
                      : (data.categoryOptions[0]?.id ?? ""),
                subcategoryId: activeTab === "skills" ? (formDialog.item.parentId ?? "") : data.subcategoryOptions[0]?.id ?? "",
              }
            : undefined
        }
        levelLabel={activeTab === "skillLevels" && formDialog?.item ? formDialog.item.context : undefined}
        categoryOptions={data.categoryOptions}
        subcategoryOptions={data.subcategoryOptions}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onCancel={closeFormDialog}
        onSave={handleSaveForm}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:justify-end sm:pr-6"
        >
          <div className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-white shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
