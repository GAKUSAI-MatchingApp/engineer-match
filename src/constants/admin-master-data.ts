/**
 * Admin Master Data management module labels (Japanese). Real data comes
 * from src/lib/admin/master-data.ts for the 5 tables with a real schema
 * match: skill_categories, skill_subcategories, skills, qualifications,
 * skill_levels (003_master_tables.sql). The mock UI's other 5 tabs (業種/
 * 職種/勤務地/契約形態/求人・案件カテゴリ/通報カテゴリ) have no backing
 * table and have been dropped rather than faked.
 *
 * Delete is never exposed -- is_active is the only lifecycle control, so
 * referenced master rows can never be destructively removed. skill_levels
 * is a fixed 1-7 set (chk_skill_levels_level): name/description are
 * editable, no add/delete/active-toggle for that tab.
 */

export const ADMIN_MASTER_DATA_PAGE = {
  title: "マスタ管理",
  description: "スキル・資格などプラットフォーム共通のマスタデータを管理できます。",
} as const;

export const MASTER_DATA_TABS = [
  { key: "skills", label: "スキル" },
  { key: "skillSubcategories", label: "スキルサブカテゴリ" },
  { key: "skillCategories", label: "スキルカテゴリ" },
  { key: "qualifications", label: "資格" },
  { key: "skillLevels", label: "ITSSレベル" },
] as const;
export type MasterDataTabKey = (typeof MASTER_DATA_TABS)[number]["key"];

export const MASTER_DATA_LABELS = {
  searchLabel: "マスタデータを検索",
  searchPlaceholder: "表示名で検索",
  activeOnlyLabel: "有効のみ表示",
  resultsSuffix: "件",
  addLabel: "追加",
  editLabel: "編集",
  enableLabel: "有効化",
  disableLabel: "無効化",
} as const;

export const MASTER_DATA_TABLE_COLUMNS = ["表示名", "分類", "説明", "利用件数", "状態", "操作"] as const;

export const MASTER_DATA_TOAST_MESSAGES = {
  created: "マスタデータを追加しました。",
  updated: "マスタデータを更新しました。",
  enabled: "有効化しました。",
  disabled: "無効化しました。",
} as const;

export const MASTER_DATA_ERROR_FALLBACK = "操作に失敗しました。もう一度お試しください。";

export const MASTER_DATA_FORM_LABELS = {
  addTitle: "マスタデータを追加",
  editTitle: "マスタデータを編集",
  nameLabel: "表示名",
  descriptionLabel: "説明",
  organizationLabel: "発行団体",
  categoryLabel: "分類（自由入力）",
  parentCategoryLabel: "スキルカテゴリ",
  parentSubcategoryLabel: "スキルサブカテゴリ",
  cancelLabel: "キャンセル",
  saveLabel: "保存する",
} as const;
