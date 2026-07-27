/**
 * Company (employer) profile module content (Japanese). Backs a real
 * Supabase CRUD (see src/lib/company/profile.ts). Statistics shown on the
 * profile page are computed for real from public.opportunities/applications
 * -- see getCompanyMetrics() in src/lib/company/dashboard.ts.
 */

// ============================================================
// Company profile
// ============================================================

export const COMPANY_PROFILE_PAGE = {
  title: "企業プロフィール",
  description: "求職者に表示される企業情報を管理できます。",
  editLabel: "編集",
  cancelLabel: "キャンセル",
  previewLabel: "会社ページを確認",
  previewDemoMessage: "この機能は今後実装予定です。",
} as const;

/** company_profiles.company_size — matches chk_company_profiles_size in 004_profile_tables.sql. */
export const COMPANY_SIZE_OPTIONS = [
  { value: "1-10", label: "1〜10名" },
  { value: "11-50", label: "11〜50名" },
  { value: "51-100", label: "51〜100名" },
  { value: "101-300", label: "101〜300名" },
  { value: "301-1000", label: "301〜1000名" },
  { value: "1001+", label: "1001名以上" },
] as const;

export const COMPANY_PROFILE_FORM = {
  companyNameLabel: "会社名",
  companyNamePlaceholder: "株式会社サンプル",
  industryLabel: "業種",
  industryPlaceholder: "業務効率化SaaSの開発・提供",
  /** Phase 5 決定事項③: master-select placeholder, replacing the old free-text industry Input in the edit form. */
  industryCategoryPlaceholder: "選択してください",
  companySizeLabel: "従業員数",
  companySizePlaceholder: "選択してください",
  prefectureLabel: "都道府県",
  prefecturePlaceholder: "東京都",
  addressLabel: "住所",
  addressPlaceholder: "渋谷区渋谷2-1-1 テックタワー15F",
  websiteLabel: "コーポレートサイト",
  websitePlaceholder: "https://example.com",
  establishedYearLabel: "設立年",
  establishedYearPlaceholder: "2014",
  businessDescriptionLabel: "企業紹介",
  businessDescriptionPlaceholder: "事業内容や特徴などを入力してください。",
  logoUrlLabel: "ロゴ画像URL",
  logoUrlPlaceholder: "https://example.com/logo.png",
  contactPersonLabel: "ご担当者名",
  contactPersonPlaceholder: "採用担当 山田",
  saveLabel: "保存する",
  savingLabel: "保存中…",
  savedMessage: "プロフィールを保存しました。",
  emptyNameMessage: "会社名が未登録です",
  emptyDescriptionMessage: "企業紹介文が未登録です。",
} as const;

export const COMPANY_PROFILE_ERRORS = {
  nameRequired: "会社名を入力してください。",
  invalidYear: "設立年は1800〜2100の範囲で入力してください。",
  invalidYearFuture: "設立年に本年より後の年は入力できません。",
  descriptionTooLong: "企業紹介は2000文字以内で入力してください。",
  notSignedIn: "ログイン情報を確認できませんでした。再度ログインしてください。",
  saveFailed:
    "企業プロフィールの保存に失敗しました。しばらくしてから再度お試しください。",
} as const;

