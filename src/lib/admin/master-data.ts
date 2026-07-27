import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAdminAuditLog } from "@/lib/admin/audit";

export interface AdminMasterDataItem {
  id: string;
  displayName: string;
  context: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  usageCount: number;
  /** category_id for subcategories, subcategory_id for skills; null otherwise. */
  parentId: string | null;
  /** Raw organization value for qualifications (context is a combined display string); null otherwise. */
  organization: string | null;
  /** Raw free-text category value for qualifications; null otherwise. */
  categoryText: string | null;
}

export interface AdminMasterDataOption {
  id: string;
  name: string;
}

export interface AdminMasterData {
  skillCategories: AdminMasterDataItem[];
  skillSubcategories: AdminMasterDataItem[];
  skills: AdminMasterDataItem[];
  qualifications: AdminMasterDataItem[];
  skillLevels: AdminMasterDataItem[];
  /** public.industry_categories, per 064_industry_categories.sql draft (Phase 5 決定事項③). */
  industries: AdminMasterDataItem[];
  categoryOptions: AdminMasterDataOption[];
  subcategoryOptions: (AdminMasterDataOption & { categoryId: string })[];
}

const CATEGORY_CODE_LABEL: Record<string, string> = {
  TECHNICAL: "テクニカル",
  HUMAN: "ヒューマン",
  BUSINESS: "ビジネス",
};

/**
 * Real master data for the 5 tables with an actual schema match:
 * skill_categories, skill_subcategories, skills, qualifications,
 * skill_levels (003_master_tables.sql). The mock UI's other 5 tabs
 * (業種/職種/勤務地/契約形態/求人・案件カテゴリ/通報カテゴリ) have no
 * backing table and are intentionally dropped rather than faked.
 * usageCount is a real count against user_skills / user_qualifications --
 * the same tables the RESTRICT FKs that block hard deletion are defined on
 * (delete is not exposed here at all; is_active is the only lifecycle
 * control, so referenced rows can never be destructively removed).
 */
export async function getAdminMasterData(supabase: SupabaseClient): Promise<AdminMasterData> {
  const [
    { data: categories },
    { data: subcategories },
    { data: skills },
    { data: qualifications },
    { data: skillLevels },
    { data: industries },
    { data: userSkillLinks },
    { data: userQualificationLinks },
    { data: userSkillLevelLinks },
    { data: companyIndustryLinks },
  ] = await Promise.all([
    supabase.from("skill_categories").select("id, code, name, display_order, is_active").order("display_order"),
    supabase.from("skill_subcategories").select("id, category_id, name, display_order, is_active").order("display_order"),
    supabase
      .from("skills")
      .select("id, subcategory_id, name, description, display_order, is_active")
      .order("display_order"),
    supabase
      .from("qualifications")
      .select("id, name, organization, category, display_order, is_active")
      .order("display_order"),
    supabase.from("skill_levels").select("level, name, description, is_active").order("level"),
    supabase.from("industry_categories").select("id, name, display_order, is_active").order("display_order"),
    supabase.from("user_skills").select("skill_id"),
    supabase.from("user_qualifications").select("qualification_id"),
    supabase.from("user_skills").select("skill_level"),
    supabase.from("company_profiles").select("industry_category_id"),
  ]);

  const subcategoryCountByCategory = new Map<string, number>();
  for (const row of subcategories ?? []) {
    const catId = row.category_id as string;
    subcategoryCountByCategory.set(catId, (subcategoryCountByCategory.get(catId) ?? 0) + 1);
  }

  const skillCountBySubcategory = new Map<string, number>();
  for (const row of skills ?? []) {
    const subId = row.subcategory_id as string;
    skillCountBySubcategory.set(subId, (skillCountBySubcategory.get(subId) ?? 0) + 1);
  }

  const subcategoryById = new Map((subcategories ?? []).map((row) => [row.id as string, row]));
  const categoryNameById = new Map((categories ?? []).map((row) => [row.id as string, row.name as string]));

  const skillUsageCount = new Map<string, number>();
  for (const row of userSkillLinks ?? []) {
    const skillId = row.skill_id as string;
    skillUsageCount.set(skillId, (skillUsageCount.get(skillId) ?? 0) + 1);
  }
  const qualificationUsageCount = new Map<string, number>();
  for (const row of userQualificationLinks ?? []) {
    const qualId = row.qualification_id as string;
    qualificationUsageCount.set(qualId, (qualificationUsageCount.get(qualId) ?? 0) + 1);
  }
  const skillLevelUsageCount = new Map<number, number>();
  for (const row of userSkillLevelLinks ?? []) {
    const level = row.skill_level as number | null;
    if (level === null) continue;
    skillLevelUsageCount.set(level, (skillLevelUsageCount.get(level) ?? 0) + 1);
  }
  const industryUsageCount = new Map<string, number>();
  for (const row of companyIndustryLinks ?? []) {
    const industryId = row.industry_category_id as string | null;
    if (industryId === null) continue;
    industryUsageCount.set(industryId, (industryUsageCount.get(industryId) ?? 0) + 1);
  }

  return {
    skillCategories: (categories ?? []).map((row) => ({
      id: row.id as string,
      displayName: row.name as string,
      context: CATEGORY_CODE_LABEL[row.code as string] ?? (row.code as string),
      description: null,
      sortOrder: row.display_order as number,
      active: row.is_active as boolean,
      usageCount: subcategoryCountByCategory.get(row.id as string) ?? 0,
      parentId: null,
      organization: null,
      categoryText: null,
    })),
    skillSubcategories: (subcategories ?? []).map((row) => ({
      id: row.id as string,
      displayName: row.name as string,
      context: categoryNameById.get(row.category_id as string) ?? "",
      description: null,
      sortOrder: row.display_order as number,
      active: row.is_active as boolean,
      usageCount: skillCountBySubcategory.get(row.id as string) ?? 0,
      parentId: row.category_id as string,
      organization: null,
      categoryText: null,
    })),
    skills: (skills ?? []).map((row) => {
      const subcategory = subcategoryById.get(row.subcategory_id as string);
      const categoryName = subcategory ? categoryNameById.get(subcategory.category_id as string) : undefined;
      const context = [categoryName, subcategory?.name as string | undefined].filter(Boolean).join(" / ");
      return {
        id: row.id as string,
        displayName: row.name as string,
        context,
        description: (row.description as string | null) ?? null,
        sortOrder: row.display_order as number,
        active: row.is_active as boolean,
        usageCount: skillUsageCount.get(row.id as string) ?? 0,
        parentId: row.subcategory_id as string,
        organization: null,
        categoryText: null,
      };
    }),
    qualifications: (qualifications ?? []).map((row) => ({
      id: row.id as string,
      displayName: row.name as string,
      context: [row.organization as string, row.category as string | null].filter(Boolean).join(" / "),
      description: null,
      sortOrder: row.display_order as number,
      active: row.is_active as boolean,
      usageCount: qualificationUsageCount.get(row.id as string) ?? 0,
      parentId: null,
      organization: row.organization as string,
      categoryText: (row.category as string | null) ?? null,
    })),
    skillLevels: (skillLevels ?? []).map((row) => ({
      id: String(row.level),
      displayName: row.name as string,
      context: `レベル${row.level as number}`,
      description: (row.description as string | null) ?? null,
      sortOrder: row.level as number,
      active: row.is_active as boolean,
      usageCount: skillLevelUsageCount.get(row.level as number) ?? 0,
      parentId: null,
      organization: null,
      categoryText: null,
    })),
    industries: (industries ?? []).map((row) => ({
      id: row.id as string,
      displayName: row.name as string,
      context: "",
      description: null,
      sortOrder: row.display_order as number,
      active: row.is_active as boolean,
      usageCount: industryUsageCount.get(row.id as string) ?? 0,
      parentId: null,
      organization: null,
      categoryText: null,
    })),
    categoryOptions: (categories ?? []).map((row) => ({ id: row.id as string, name: row.name as string })),
    subcategoryOptions: (subcategories ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      categoryId: row.category_id as string,
    })),
  };
}

export interface MasterDataMutationResult {
  error: string | null;
}

export interface MasterDataCreateResult {
  error: string | null;
  id: string | null;
}

async function auditMasterDataChange(
  supabase: SupabaseClient,
  actionType: string,
  targetType: string,
  targetId: string,
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
) {
  await writeAdminAuditLog(supabase, { actionType, targetType, targetId, beforeData, afterData });
}

// ============================================================
// skill_categories -- code is a fixed enum (TECHNICAL/HUMAN/BUSINESS), no
// add/delete here; only name + is_active are editable.
// ============================================================

export async function updateSkillCategory(
  supabase: SupabaseClient,
  id: string,
  name: string,
): Promise<MasterDataMutationResult> {
  const { data: before } = await supabase.from("skill_categories").select("name").eq("id", id).maybeSingle();
  const { data: updated, error } = await supabase
    .from("skill_categories")
    .update({ name })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to update skill category:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(supabase, "master_data_update", "skill_category", id, before, { name });
  return { error: null };
}

export async function setSkillCategoryActive(
  supabase: SupabaseClient,
  id: string,
  active: boolean,
): Promise<MasterDataMutationResult> {
  const { data: updated, error } = await supabase
    .from("skill_categories")
    .update({ is_active: active })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to toggle skill category:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(
    supabase,
    active ? "master_data_enable" : "master_data_disable",
    "skill_category",
    id,
    { is_active: !active },
    { is_active: active },
  );
  return { error: null };
}

// ============================================================
// skill_subcategories
// ============================================================

export async function createSkillSubcategory(
  supabase: SupabaseClient,
  categoryId: string,
  name: string,
): Promise<MasterDataCreateResult> {
  const { data, error } = await supabase
    .from("skill_subcategories")
    .insert({ category_id: categoryId, name })
    .select("id")
    .single();
  if (error) {
    console.error("[admin] failed to create skill subcategory:", error);
    return { error: "追加に失敗しました。同名のサブカテゴリがすでに存在する可能性があります。", id: null };
  }
  await auditMasterDataChange(supabase, "master_data_create", "skill_subcategory", data.id as string, null, {
    category_id: categoryId,
    name,
  });
  return { error: null, id: data.id as string };
}

export async function updateSkillSubcategory(
  supabase: SupabaseClient,
  id: string,
  categoryId: string,
  name: string,
): Promise<MasterDataMutationResult> {
  const { data: before } = await supabase
    .from("skill_subcategories")
    .select("category_id, name")
    .eq("id", id)
    .maybeSingle();
  const { data: updated, error } = await supabase
    .from("skill_subcategories")
    .update({ category_id: categoryId, name })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to update skill subcategory:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(supabase, "master_data_update", "skill_subcategory", id, before, {
    category_id: categoryId,
    name,
  });
  return { error: null };
}

export async function setSkillSubcategoryActive(
  supabase: SupabaseClient,
  id: string,
  active: boolean,
): Promise<MasterDataMutationResult> {
  const { data: updated, error } = await supabase
    .from("skill_subcategories")
    .update({ is_active: active })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to toggle skill subcategory:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(
    supabase,
    active ? "master_data_enable" : "master_data_disable",
    "skill_subcategory",
    id,
    { is_active: !active },
    { is_active: active },
  );
  return { error: null };
}

// ============================================================
// skills
// ============================================================

export async function createSkill(
  supabase: SupabaseClient,
  subcategoryId: string,
  name: string,
  description: string,
): Promise<MasterDataCreateResult> {
  const { data, error } = await supabase
    .from("skills")
    .insert({ subcategory_id: subcategoryId, name, description: description || null })
    .select("id")
    .single();
  if (error) {
    console.error("[admin] failed to create skill:", error);
    return { error: "追加に失敗しました。同名のスキルがすでに存在する可能性があります。", id: null };
  }
  await auditMasterDataChange(supabase, "master_data_create", "skill", data.id as string, null, {
    subcategory_id: subcategoryId,
    name,
    description,
  });
  return { error: null, id: data.id as string };
}

export async function updateSkill(
  supabase: SupabaseClient,
  id: string,
  subcategoryId: string,
  name: string,
  description: string,
): Promise<MasterDataMutationResult> {
  const { data: before } = await supabase
    .from("skills")
    .select("subcategory_id, name, description")
    .eq("id", id)
    .maybeSingle();
  const { data: updated, error } = await supabase
    .from("skills")
    .update({ subcategory_id: subcategoryId, name, description: description || null })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to update skill:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(supabase, "master_data_update", "skill", id, before, {
    subcategory_id: subcategoryId,
    name,
    description,
  });
  return { error: null };
}

export async function setSkillActive(
  supabase: SupabaseClient,
  id: string,
  active: boolean,
): Promise<MasterDataMutationResult> {
  const { data: updated, error } = await supabase
    .from("skills")
    .update({ is_active: active })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to toggle skill:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(
    supabase,
    active ? "master_data_enable" : "master_data_disable",
    "skill",
    id,
    { is_active: !active },
    { is_active: active },
  );
  return { error: null };
}

// ============================================================
// qualifications
// ============================================================

export async function createQualification(
  supabase: SupabaseClient,
  name: string,
  organization: string,
  category: string,
): Promise<MasterDataCreateResult> {
  const { data, error } = await supabase
    .from("qualifications")
    .insert({ name, organization, category: category || null })
    .select("id")
    .single();
  if (error) {
    console.error("[admin] failed to create qualification:", error);
    return { error: "追加に失敗しました。同じ発行団体・名称の資格がすでに存在する可能性があります。", id: null };
  }
  await auditMasterDataChange(supabase, "master_data_create", "qualification", data.id as string, null, {
    name,
    organization,
    category,
  });
  return { error: null, id: data.id as string };
}

export async function updateQualification(
  supabase: SupabaseClient,
  id: string,
  name: string,
  organization: string,
  category: string,
): Promise<MasterDataMutationResult> {
  const { data: before } = await supabase
    .from("qualifications")
    .select("name, organization, category")
    .eq("id", id)
    .maybeSingle();
  const { data: updated, error } = await supabase
    .from("qualifications")
    .update({ name, organization, category: category || null })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to update qualification:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(supabase, "master_data_update", "qualification", id, before, {
    name,
    organization,
    category,
  });
  return { error: null };
}

export async function setQualificationActive(
  supabase: SupabaseClient,
  id: string,
  active: boolean,
): Promise<MasterDataMutationResult> {
  const { data: updated, error } = await supabase
    .from("qualifications")
    .update({ is_active: active })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to toggle qualification:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(
    supabase,
    active ? "master_data_enable" : "master_data_disable",
    "qualification",
    id,
    { is_active: !active },
    { is_active: active },
  );
  return { error: null };
}

// ============================================================
// skill_levels -- fixed 1-7 (chk_skill_levels_level), no add/delete/active
// toggle; name/description only, per the narrow scope requested.
// ============================================================

export async function updateSkillLevel(
  supabase: SupabaseClient,
  level: number,
  name: string,
  description: string,
): Promise<MasterDataMutationResult> {
  const { data: before } = await supabase
    .from("skill_levels")
    .select("name, description")
    .eq("level", level)
    .maybeSingle();
  const { data: updated, error } = await supabase
    .from("skill_levels")
    .update({ name, description: description || null })
    .eq("level", level)
    .select("level")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to update skill level:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(supabase, "master_data_update", "skill_level", String(level), before, {
    name,
    description,
  });
  return { error: null };
}

// ============================================================
// industry_categories -- per 064_industry_categories.sql draft (Phase 5
// 決定事項③). Flat, no hierarchy/parent, so this is the simplest of the 6
// master tables: only `name` is editable, matching skill_categories'
// shape but with add/delete-via-is_active support like qualifications
// (industries are not a fixed code enum). Delete is never exposed here
// either -- is_active is the only lifecycle control, same rationale as
// every other master table in this file.
// ============================================================

export async function createIndustryCategory(
  supabase: SupabaseClient,
  name: string,
): Promise<MasterDataCreateResult> {
  const { data, error } = await supabase
    .from("industry_categories")
    .insert({ name })
    .select("id")
    .single();
  if (error) {
    console.error("[admin] failed to create industry category:", error);
    return { error: "追加に失敗しました。同名の業種がすでに存在する可能性があります。", id: null };
  }
  await auditMasterDataChange(supabase, "master_data_create", "industry_category", data.id as string, null, {
    name,
  });
  return { error: null, id: data.id as string };
}

export async function updateIndustryCategory(
  supabase: SupabaseClient,
  id: string,
  name: string,
): Promise<MasterDataMutationResult> {
  const { data: before } = await supabase.from("industry_categories").select("name").eq("id", id).maybeSingle();
  const { data: updated, error } = await supabase
    .from("industry_categories")
    .update({ name })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to update industry category:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(supabase, "master_data_update", "industry_category", id, before, { name });
  return { error: null };
}

export async function setIndustryCategoryActive(
  supabase: SupabaseClient,
  id: string,
  active: boolean,
): Promise<MasterDataMutationResult> {
  const { data: updated, error } = await supabase
    .from("industry_categories")
    .update({ is_active: active })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    console.error("[admin] failed to toggle industry category:", error);
    return { error: "更新に失敗しました。" };
  }
  await auditMasterDataChange(
    supabase,
    active ? "master_data_enable" : "master_data_disable",
    "industry_category",
    id,
    { is_active: !active },
    { is_active: active },
  );
  return { error: null };
}
