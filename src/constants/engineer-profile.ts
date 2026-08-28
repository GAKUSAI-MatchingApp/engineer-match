/**
 * Engineer Profile module content (Japanese).
 * Real Supabase-backed data (see src/lib/engineer/profile.ts,
 * src/lib/engineer/personal-info.ts, src/lib/engineer/preferred-conditions.ts,
 * src/lib/engineer/work-experience.ts, src/lib/engineer/education.ts,
 * src/lib/engineer/languages.ts, src/lib/engineer/portfolio.ts,
 * src/lib/engineer/skills.ts, src/lib/engineer/qualifications.ts) against
 * public.users + engineer_profiles + engineer_personal_info +
 * engineer_contact_details + engineer_preferred_contract_types +
 * engineer_preferred_locations + engineer_work_experiences(_technologies) +
 * engineer_educations + engineer_languages + engineer_portfolio_projects(_technologies)
 * + user_skills/skills + user_qualifications/qualifications. Human/Business
 * skill labels remain separate (src/constants/skill-assessment.ts) --
 * untouched here.
 *
 * Every field from the original UI-only mock (job title, availability status,
 * birth date, gender, phone, nearest station, GitHub URL, work history,
 * education, multi-project portfolio, languages, and the full preferred-
 * conditions set) has been restored with real Supabase backing -- see
 * migrations 039-048. The only exceptions are two items that never actually
 * existed in any historical version of this app (a detailed street address
 * field, and an education enrolled/graduated status flag) and the
 * favorite/scout feature area, which is a separate module, not part of the
 * Engineer Profile.
 */

// ============================================================
// Profile header
// ============================================================

export const PROFILE_HEADER_META = {
  editLabel: "プロフィールを編集",
  editHref: "/engineer/profile/edit",
  previewLabel: "公開プロフィールを確認",
  previewHref: "/engineer/profile/preview",
} as const;

// ============================================================
// Public profile preview (RD #21) -- reuses the same display-only
// components/query as the company-side engineer detail page
// (src/app/company/engineers/[id]/page.tsx), just called with the viewer's
// own id. See src/app/engineer/profile/preview/page.tsx.
// ============================================================

export const PROFILE_PREVIEW_META = {
  pageTitle: "公開プロフィールのプレビュー",
  backLabel: "プロフィールに戻る",
  backHref: "/engineer/profile",
  privateNotice:
    "現在プロフィールは非公開です。この画面では公開時の表示を確認できますが、現在は企業から検索・閲覧できません。",
  notFoundMessage:
    "プレビューできるプロフィール情報がまだ登録されていません。プロフィールを編集して情報を入力してください。",
} as const;

export const VISIBILITY_STATUS_LABEL = {
  public: "公開",
  private: "非公開",
} as const;

// ============================================================
// Profile completion
// ============================================================

export const PROFILE_COMPLETION_META = {
  title: "プロフィール充実度",
  description: "プロフィールを充実させると、企業からのスカウト率が上がります。",
  ctaLabel: "プロフィールを編集",
  ctaHref: "/engineer/profile/edit",
} as const;

// ============================================================
// Basic information
// ============================================================

export const BASIC_INFO_SECTION = {
  title: "基本情報",
} as const;

export const BASIC_INFO_LABELS = {
  bio: "自己紹介",
  bioEmpty: "自己紹介文が未登録です。",
  email: "メールアドレス",
  prefecture: "居住地",
  yearsOfExperience: "経験年数",
  workStyle: "希望の働き方",
  desiredRate: "希望単価（円／時間）",
  portfolioUrl: "Portfolio URL",
  jobTitle: "職種",
  jobCategory: "職種カテゴリ",
  availabilityStatus: "稼働状況",
  githubUrl: "GitHub",
  availableFrom: "稼働開始可能日",
  unset: "未設定",
} as const;

/** engineer_profiles.job_category, per chk_engineer_profiles_job_category (039_engineer_profile_professional_fields.sql). */
export const JOB_CATEGORY_OPTIONS = [
  { value: "FRONTEND", label: "フロントエンド" },
  { value: "BACKEND", label: "バックエンド" },
  { value: "FULLSTACK", label: "フルスタック" },
  { value: "INFRA", label: "インフラ" },
  { value: "CLOUD", label: "クラウド" },
  { value: "AI_DATA", label: "AI・データ" },
  { value: "PM", label: "PM" },
  { value: "QA", label: "QA" },
  { value: "SECURITY", label: "セキュリティ" },
] as const;

/** engineer_profiles.availability_status, per chk_engineer_profiles_availability_status (039). Engineer-side vocabulary (see full inventory discussion). */
export const AVAILABILITY_STATUS_OPTIONS = [
  { value: "IMMEDIATE", label: "即日対応可能" },
  { value: "NEGOTIABLE", label: "案件相談可能" },
  { value: "CURRENTLY_EMPLOYED", label: "現職継続中（応相談）" },
  { value: "ON_LEAVE", label: "休職中" },
] as const;

// ============================================================
// Personal info (生年月日/性別/電話番号/最寄り駅) -- engineer_personal_info +
// engineer_contact_details. Two separate backing tables with two separate
// company-visibility tiers (see src/lib/engineer/personal-info.ts), but the
// engineer edits all four together in one form.
// ============================================================

export const PERSONAL_INFO_SECTION = {
  title: "個人情報",
  description: "この情報は本人と管理者のみ閲覧できます。応募先企業には電話番号・最寄り駅のみ、応募後に共有されます。",
} as const;

export const PERSONAL_INFO_LABELS = {
  birthDate: "生年月日",
  gender: "性別",
  phone: "電話番号",
  nearestStation: "最寄り駅",
  unset: "未設定",
} as const;

export const GENDER_OPTIONS = [
  { value: "MALE", label: "男性" },
  { value: "FEMALE", label: "女性" },
  { value: "UNSPECIFIED", label: "回答しない" },
] as const;

export const PERSONAL_INFO_FORM_META = {
  saveLabel: "個人情報を保存",
  savingLabel: "保存中…",
  savedMessage: "個人情報を更新しました。",
  saveFailedMessage: "個人情報の保存に失敗しました。しばらくしてから再度お試しください。",
} as const;

// ============================================================
// Skills
// ============================================================

export const SKILLS_SECTION = {
  title: "スキル",
  technicalTitle: "テクニカルスキル",
  humanTitle: "ヒューマンスキル",
  businessTitle: "ビジネススキル",
} as const;

export const TECHNICAL_SKILLS_EMPTY_MESSAGE = "テクニカルスキルが未登録です。";

/**
 * ヒューマンスキル (コミュニケーション能力 / ヒアリング力 / プレゼンテーション力) is
 * real Supabase data (see src/lib/engineer/skill-assessments.ts,
 * public.skill_assessments + skill_assessment_attempts,
 * 030_skill_assessments.sql).
 */
export const HUMAN_SKILL_EDIT_NOTE = {
  description:
    "ヒューマンスキルは診断結果に基づいて表示されます。プロフィール画面から各診断を実施・再診断してください。",
  ctaLabel: "プロフィールで診断する",
  ctaHref: "/engineer/profile",
} as const;

/**
 * ビジネススキル (課題解決力 / 論理的思考力 / タスク管理力 / 主体性 /
 * チームワーク力 / 調整・交渉力) is real Supabase data (see
 * src/lib/engineer/skill-assessments.ts, public.skill_assessments +
 * skill_assessment_attempts, 031_business_skill_assessments.sql).
 */
export const BUSINESS_SKILL_EDIT_NOTE = {
  description:
    "ビジネススキルは診断結果に基づいて表示されます。プロフィール画面から各診断を実施・再診断してください。",
  ctaLabel: "プロフィールで診断する",
  ctaHref: "/engineer/profile",
} as const;

export const TECHNICAL_SKILL_EDITOR_LABELS = {
  skillLabel: "スキル",
  levelLabel: "ITSSレベル",
  experienceYearsLabel: "経験年数（年）",
  addLabel: "テクニカルスキルを追加",
  removeLabel: "このスキルを削除",
  countSuffix: "件登録中",
  skillNamePlaceholder: "スキル名を入力（例: React）",
  emptyCatalogMessage: "候補がありません。スキル名を入力すると新規登録できます。",
  emptyMessage: "テクニカルスキルが未登録です。",
  addError: "スキルの追加に失敗しました。しばらくしてから再度お試しください。",
  updateError: "スキルの更新に失敗しました。しばらくしてから再度お試しください。",
  removeError: "スキルの削除に失敗しました。しばらくしてから再度お試しください。",
  limitMaxError: "テクニカルスキルは20件まで登録できます。",
  limitMinError: "テクニカルスキルは1件以上登録する必要があるため、削除できません。",
  alreadyAddedError: "このスキルは既に登録済みです。",
  invalidSkillNameError: "スキル名は1〜50文字で、英数字・かな・漢字のいずれかを含めて入力してください。",
  registerNewPrefix: "「",
  registerNewSuffix: "」を新規登録",
} as const;

// ============================================================
// Qualifications
// ============================================================

export const QUALIFICATIONS_SECTION = {
  title: "資格",
} as const;

export const QUALIFICATION_EDITOR_LABELS = {
  qualificationLabel: "資格",
  yearLabel: "取得年",
  yearPlaceholder: "2022",
  expirationDateLabel: "有効期限",
  noExpirationLabel: "有効期限なし",
  addLabel: "資格を追加",
  removeLabel: "この資格を削除",
  emptyCatalogMessage: "追加可能な資格がありません。",
  emptyMessage: "資格情報が未登録です。",
  addError: "資格の追加に失敗しました。しばらくしてから再度お試しください。",
  updateError: "資格の更新に失敗しました。しばらくしてから再度お試しください。",
  removeError: "資格の削除に失敗しました。しばらくしてから再度お試しください。",
  invalidYear: "取得年は1950〜2100の範囲で入力してください。",
} as const;

// ============================================================
// Work experience (職務経歴) -- engineer_work_experiences(_technologies)
// ============================================================

export const WORK_EXPERIENCE_SECTION = {
  title: "職務経歴",
} as const;

/** engineer_work_experiences.employment_type, per chk_engineer_work_experiences_employment_type (045_engineer_work_experiences.sql). */
export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "正社員" },
  { value: "CONTRACT", label: "契約社員" },
  { value: "FREELANCE", label: "業務委託" },
  { value: "DISPATCH", label: "派遣社員" },
  { value: "PART_TIME", label: "アルバイト・パート" },
] as const;

export const WORK_EXPERIENCE_FORM_FIELDS = {
  companyName: "会社名",
  position: "役職・ポジション",
  period: "期間",
  employmentType: "雇用形態",
  summary: "業務内容",
  technologies: "使用技術（カンマ区切り）",
} as const;

export const WORK_EXPERIENCE_EDITOR_LABELS = {
  addLabel: "職務経歴を追加",
  removeLabel: "この職務経歴を削除",
  emptyMessage: "職務経歴が未登録です。",
  saveLabel: "この変更を保存",
  cancelLabel: "キャンセル",
  addError: "職務経歴の追加に失敗しました。しばらくしてから再度お試しください。",
  updateError: "職務経歴の更新に失敗しました。しばらくしてから再度お試しください。",
  removeError: "職務経歴の削除に失敗しました。しばらくしてから再度お試しください。",
  companyNameRequired: "会社名を入力してください。",
} as const;

// ============================================================
// Education (学歴) -- engineer_educations
// ============================================================

export const EDUCATION_SECTION = {
  title: "学歴",
} as const;

export const EDUCATION_FORM_FIELDS = {
  schoolName: "学校名",
  department: "学部・学科",
  period: "期間",
  description: "概要",
} as const;

export const EDUCATION_EDITOR_LABELS = {
  addLabel: "学歴を追加",
  removeLabel: "この学歴を削除",
  emptyMessage: "学歴が未登録です。",
  saveLabel: "この変更を保存",
  cancelLabel: "キャンセル",
  addError: "学歴の追加に失敗しました。しばらくしてから再度お試しください。",
  updateError: "学歴の更新に失敗しました。しばらくしてから再度お試しください。",
  removeError: "学歴の削除に失敗しました。しばらくしてから再度お試しください。",
  schoolNameRequired: "学校名を入力してください。",
} as const;

// ============================================================
// Languages (言語) -- engineer_languages
// ============================================================

export const LANGUAGES_SECTION = {
  title: "言語",
} as const;

/** engineer_languages.level, per chk_engineer_languages_level (047_engineer_languages.sql). */
export const LANGUAGE_LEVEL_OPTIONS = [
  { value: "NATIVE", label: "ネイティブ" },
  { value: "BUSINESS", label: "ビジネスレベル" },
  { value: "CONVERSATIONAL", label: "日常会話レベル" },
  { value: "BASIC", label: "基礎レベル" },
  { value: "LEARNING", label: "学習中" },
] as const;

/** Free-text suggestions only -- engineer_languages.language_name has no catalog FK (old data included non-standard entries). */
export const LANGUAGE_NAME_SUGGESTIONS = [
  "日本語",
  "英語",
  "中国語（簡体）",
  "中国語（繁体）",
  "韓国語",
  "ベンガル語",
  "ヒンディー語",
  "ベトナム語",
  "タイ語",
  "インドネシア語",
  "スペイン語",
  "フランス語",
  "ドイツ語",
  "イタリア語",
  "ポルトガル語",
  "ロシア語",
  "アラビア語",
] as const;

export const LANGUAGE_EDITOR_LABELS = {
  languageLabel: "言語",
  levelLabel: "レベル",
  addLabel: "言語を追加",
  removeLabel: "この言語を削除",
  emptyMessage: "言語情報が未登録です。",
  languageNamePlaceholder: "日本語",
  addError: "言語の追加に失敗しました。しばらくしてから再度お試しください。",
  updateError: "言語の更新に失敗しました。しばらくしてから再度お試しください。",
  removeError: "言語の削除に失敗しました。しばらくしてから再度お試しください。",
} as const;

// ============================================================
// Portfolio / Projects (ポートフォリオ) -- engineer_portfolio_projects(_technologies)
// Distinct from the already-real engineer_profiles.portfolio_url (single link).
// ============================================================

export const PORTFOLIO_SECTION = {
  title: "ポートフォリオ",
} as const;

export const PORTFOLIO_FORM_FIELDS = {
  title: "プロジェクト名",
  role: "役割",
  description: "概要",
  technologies: "使用スキル（カンマ区切り）",
  url: "URL",
  period: "期間",
} as const;

export const PORTFOLIO_EDITOR_LABELS = {
  addLabel: "プロジェクトを追加",
  removeLabel: "このプロジェクトを削除",
  emptyMessage: "ポートフォリオが未登録です。",
  saveLabel: "この変更を保存",
  cancelLabel: "キャンセル",
  addError: "プロジェクトの追加に失敗しました。しばらくしてから再度お試しください。",
  updateError: "プロジェクトの更新に失敗しました。しばらくしてから再度お試しください。",
  removeError: "プロジェクトの削除に失敗しました。しばらくしてから再度お試しください。",
  titleRequired: "プロジェクト名を入力してください。",
} as const;

// ============================================================
// Preferred conditions (希望条件) -- engineer_preferred_contract_types,
// engineer_preferred_locations, engineer_profiles.desired_annual_income_*/
// desired_hourly_rate_*/available_from
// ============================================================

export const PREFERRED_CONDITIONS_SECTION = {
  title: "希望条件",
} as const;

/** engineer_preferred_contract_types.contract_type, per chk_engineer_preferred_contract_types_type (044_engineer_preferred_conditions.sql). */
export const CONTRACT_TYPE_OPTIONS = [
  { value: "EMPLOYMENT", label: "就職" },
  { value: "PROJECT", label: "案件" },
  { value: "HOURLY", label: "時間精算" },
] as const;

export const PREFERRED_CONDITIONS_FORM_FIELDS = {
  contractTypes: "希望契約形態",
  locations: "希望勤務地",
  locationPlaceholder: "東京都、フルリモート",
} as const;

export const PREFERRED_CONDITIONS_EDITOR_LABELS = {
  addLocationLabel: "勤務地を追加",
  removeLocationLabel: "この勤務地を削除",
  emptyLocationsMessage: "希望勤務地が未登録です。",
  emptyContractTypesMessage: "希望契約形態が未登録です。",
  addError: "希望条件の更新に失敗しました。しばらくしてから再度お試しください。",
} as const;

// ============================================================
// Profile visibility
// ============================================================

export const PROFILE_VISIBILITY_SECTION = {
  title: "公開設定",
  description: "企業からの検索結果およびスカウトの対象として表示されます。",
} as const;

// ============================================================
// Edit form
// ============================================================

export const PROFILE_EDIT_META = {
  pageTitle: "プロフィール編集",
  backLabel: "プロフィールに戻る",
  cancelLabel: "キャンセル",
  cancelHref: "/engineer/profile",
} as const;

export const PROFILE_EDIT_SECTIONS = {
  basicInfo: "基本情報",
  personalInfo: "個人情報",
  skills: "スキル",
  qualifications: "資格",
  workExperience: "職務経歴",
  education: "学歴",
  portfolio: "ポートフォリオ",
  languages: "言語",
  preferredConditions: "希望条件",
  visibility: "公開設定",
} as const;

/**
 * RD #23: this edit page has no page-wide "save all" -- 基本情報/個人情報 are
 * each their own independent form-submit, while every other section below
 * persists each add/edit/remove immediately. These two notice strings (shown
 * via ProfileSection's `description` prop, right under each section's own
 * heading) exist only to make that already-true save behavior legible in the
 * UI -- they change no save/validation logic.
 */
export const PROFILE_EDIT_SAVE_NOTICES = {
  independentSection: "このセクションの変更内容のみ保存されます。",
  autoSave: "追加・変更した内容は自動的に保存されます。",
} as const;

export const BASIC_INFO_FORM_FIELDS = {
  name: { label: "氏名", placeholder: "山田 太郎" },
  email: {
    label: "メールアドレス",
    helperText: "メールアドレスの変更は設定から行えます。",
    changeLinkLabel: "変更する",
    /** Anchors to EngineerEmailSettings' SectionCard id on the settings page. */
    changeHref: "/engineer/settings#email",
  },
  jobTitle: { label: "職種", placeholder: "フルスタックエンジニア" },
  jobCategory: { label: "職種カテゴリ" },
  prefecture: { label: "居住地", placeholder: "東京都" },
  yearsOfExperience: { label: "経験年数（年）", placeholder: "6" },
  availabilityStatus: { label: "稼働状況" },
  workStyle: { label: "希望の働き方" },
  desiredHourlyRate: { label: "希望単価（円／時間）", placeholder: "6000" },
  minimumHourlyRate: { label: "最低単価（円／時間）", placeholder: "4500" },
  desiredAnnualIncome: { label: "希望年収（円／年）", placeholder: "6000000" },
  availableFrom: { label: "稼働開始可能日" },
  portfolioUrl: { label: "Portfolio URL", placeholder: "https://example.com" },
  githubUrl: { label: "GitHub", placeholder: "https://github.com/username" },
  selfPr: { label: "自己紹介" },
} as const;

/** engineer_profiles.work_style, per chk_engineer_profiles_work_style (004_profile_tables.sql). */
export const WORK_STYLE_OPTIONS = [
  { value: "REMOTE", label: "フルリモート" },
  { value: "ONSITE", label: "出社" },
  { value: "HYBRID", label: "一部リモート" },
] as const;

export const VISIBILITY_FORM_LABEL = "プロフィールの公開状態";

export const BASIC_INFO_FORM_META = {
  saveLabel: "基本情報を保存",
  savingLabel: "保存中…",
  savedMessage: "プロフィールを更新しました。",
  saveFailedMessage: "プロフィールの保存に失敗しました。しばらくしてから再度お試しください。",
  invalidYearsOfExperience: "経験年数は0〜50の範囲で入力してください。",
  invalidHourlyRate: "希望単価・最低単価は1〜99999の範囲で入力してください。",
  invalidHourlyRateOrder: "最低単価は希望単価以下になるように入力してください。",
  invalidAnnualIncome: "希望年収は10000〜99990000の範囲で入力してください。",
  invalidSelfPr: "自己紹介は2000文字以内で入力してください。",
  nameRequired: "氏名を入力してください。",
  prefectureRequired: "居住地を入力してください。",
  yearsOfExperienceRequired: "経験年数を入力してください。",
  workStyleRequired: "希望の働き方を選択してください。",
  desiredHourlyRateRequired: "希望単価・最低単価を入力してください。",
} as const;
