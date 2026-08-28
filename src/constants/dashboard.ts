/**
 * Dashboard static label/navigation content (Japanese). Real per-user data
 * (header identity, stats, recent activity) is fetched separately -- see
 * src/lib/engineer/profile.ts (getEngineerHeaderIdentity) and
 * src/lib/company/profile.ts / dashboard.ts (getCompanyHeaderIdentity,
 * getCompanyDashboardData) -- rather than living in this file.
 */

// ---- Navigation ----

export const ENGINEER_NAV = [
  { href: "/engineer/dashboard", label: "ダッシュボード", icon: "layoutDashboard" },
  { href: "/engineer/profile", label: "プロフィール", icon: "userRound" },
  { href: "/engineer/jobs", label: "求人・案件を探す", icon: "search" },
  { href: "/engineer/applications", label: "応募管理", icon: "clipboardList" },
  { href: "/engineer/scouts", label: "スカウト", icon: "mail" },
  { href: "/messages", label: "メッセージ", icon: "messageSquare" },
  { href: "/notifications", label: "通知", icon: "bell" },
  { href: "/engineer/favorites", label: "お気に入り", icon: "heart" },
  { href: "/engineer/settings", label: "設定", icon: "settings" },
] as const;

export const COMPANY_NAV = [
  { href: "/company/dashboard", label: "ダッシュボード", icon: "layoutDashboard" },
  { href: "/company/profile", label: "企業プロフィール", icon: "building2" },
  { href: "/company/jobs", label: "求人・案件管理", icon: "briefcase" },
  { href: "/company/jobs/new", label: "新規掲載", icon: "filePlus2" },
  { href: "/company/applicants", label: "応募者管理", icon: "users" },
  { href: "/company/engineers", label: "エンジニア検索", icon: "search" },
  { href: "/company/messages", label: "メッセージ", icon: "messageSquare" },
  { href: "/company/notifications", label: "通知", icon: "bell" },
  { href: "/company/settings", label: "設定", icon: "settings" },
] as const;

export const DASHBOARD_LOGOUT = {
  label: "ログアウト",
  loadingLabel: "ログアウト中…",
  errorMessage:
    "ログアウトに失敗しました。しばらくしてから再度お試しください。",
} as const;

// ============================================================
// Engineer overview
// ============================================================

export const ENGINEER_WELCOME = {
  subtitle: "本日も新しいチャンスをチェックしましょう。",
} as const;

export const ENGINEER_PROFILE_COMPLETION = {
  title: "プロフィール充実度",
  description:
    "プロフィールを充実させると、企業からのスカウト率が上がります。",
  ctaLabel: "プロフィールを編集",
  ctaHref: "/engineer/profile",
} as const;

export const ENGINEER_STATS_LABELS = {
  applications: { label: "応募数", icon: "send", helper: "累計" },
  screening: { label: "選考中", icon: "clock", helper: "対応待ち" },
  favorites: { label: "お気に入り", icon: "heart", helper: "保存済み" },
} as const;

export const ENGINEER_RECOMMENDED_OPPORTUNITIES = {
  title: "新着求人・案件",
  description: "まだ応募していない、新しく公開された求人・案件です。",
  viewAllLabel: "すべて見る",
  viewAllHref: "/engineer/jobs",
  emptyMessage: "現在ご紹介できる求人・案件がありません。",
} as const;

export const ENGINEER_RECENT_APPLICATIONS = {
  title: "最近の応募状況",
  description: "応募した求人・案件の選考状況です。",
  viewAllLabel: "応募一覧を見る",
  viewAllHref: "/engineer/applications",
  emptyMessage: "まだ応募した求人・案件がありません。",
} as const;

export const ENGINEER_RECENT_MESSAGES = {
  title: "最近のメッセージ",
  viewAllLabel: "メッセージ一覧を見る",
  viewAllHref: "/messages",
  emptyMessage: "メッセージはまだありません。",
} as const;

export const ENGINEER_SKILL_SUMMARY = {
  title: "スキル・ITSSサマリー",
  description: "登録済みのスキルとITSSレベルです。",
  ctaLabel: "スキルを編集",
  ctaHref: "/engineer/profile",
  emptyMessage: "テクニカルスキルが未登録です。",
} as const;

// ============================================================
// Company overview
// ============================================================

export const COMPANY_QUICK_ACTIONS = {
  title: "クイックアクション",
  items: [
    { label: "新規求人・案件を掲載", href: "/company/jobs/new", icon: "filePlus2" },
    { label: "応募者を確認する", href: "/company/applicants", icon: "users" },
    { label: "エンジニアを検索する", href: "/company/engineers", icon: "search" },
  ],
} as const;
