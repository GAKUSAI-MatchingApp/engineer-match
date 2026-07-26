/**
 * Admin module chrome/navigation labels (Japanese) and shared dashboard
 * types. Real data (summary counts, pending approvals, recent activity) is
 * fetched in src/lib/admin/dashboard.ts -- this file only keeps the label
 * strings and style/icon maps that the presentational components need.
 */

// ============================================================
// Page meta
// ============================================================

export const ADMIN_DASHBOARD_PAGE = {
  title: "管理者ダッシュボード",
  description: "プラットフォーム全体の利用状況と運営状況を確認できます。",
} as const;

// ============================================================
// Brand / chrome labels
// ============================================================

export const ADMIN_BRAND = {
  name: "ENGINEER MATCH",
  subtitle: "管理者コンソール",
} as const;

export const ADMIN_LABELS = {
  openMenu: "メニューを開く",
  closeMenu: "メニューを閉じる",
  navigationMenu: "ナビゲーションメニュー",
  detailsButton: "詳細を確認",
} as const;

// ============================================================
// Navigation
// ============================================================

export const ADMIN_NAV = [
  { href: "/admin", label: "ダッシュボード", icon: "layoutDashboard" },
  { href: "/admin/users", label: "ユーザー管理", icon: "users" },
  { href: "/admin/companies", label: "企業管理", icon: "building2" },
  { href: "/admin/opportunities", label: "求人・案件管理", icon: "briefcase" },
  { href: "/admin/applications", label: "応募管理", icon: "clipboardList" },
  { href: "/admin/messages", label: "メッセージ管理", icon: "messageSquare" },
  { href: "/admin/reports", label: "通報管理", icon: "shieldAlert" },
  { href: "/admin/reviews", label: "レビュー確認", icon: "star" },
  { href: "/admin/master-data", label: "マスタ管理", icon: "listChecks" },
  { href: "/admin/notifications", label: "通知", icon: "bell" },
  { href: "/admin/settings", label: "システム設定", icon: "settings" },
] as const;

// ============================================================
// Pending approvals
// ============================================================
//
// Phase 1 only has real backing for abuse-report approvals -- companies and
// opportunities have no review/approval status in the schema (see the audit:
// company_profiles has no status column, opportunities only has
// draft/published/closed). The type union below is kept for the shape it was
// already given, but only "通報対応待ち" is ever populated with real data
// today.

export const ADMIN_APPROVAL_TYPES = [
  "企業審査待ち",
  "求人審査待ち",
  "通報対応待ち",
] as const;
export type AdminApprovalType = (typeof ADMIN_APPROVAL_TYPES)[number];

export const ADMIN_APPROVAL_TYPE_STYLES: Record<AdminApprovalType, string> = {
  企業審査待ち: "bg-indigo-50 text-indigo-700",
  求人審査待ち: "bg-blue-50 text-blue-700",
  通報対応待ち: "bg-red-50 text-red-700",
};

export const ADMIN_APPROVAL_TYPE_ICONS: Record<AdminApprovalType, string> = {
  企業審査待ち: "building2",
  求人審査待ち: "briefcase",
  通報対応待ち: "shieldAlert",
};

export const ADMIN_PENDING_APPROVALS_SECTION = {
  title: "対応待ちの通報",
  description: "未対応・対応中の通報件数です。",
} as const;

export interface AdminApprovalItem {
  id: string;
  type: AdminApprovalType;
  title: string;
  submittedBy: string;
  dateLabel: string;
  status: string;
  detailsHref: string;
}

// ============================================================
// Recent activity
// ============================================================

export const ADMIN_RECENT_ACTIVITY_SECTION = {
  title: "最近のアクティビティ（管理者操作ログ）",
  description: "管理者による操作の直近の履歴です。",
} as const;

// ============================================================
// Quick actions
// ============================================================

export const ADMIN_QUICK_ACTIONS = {
  title: "クイックアクション",
  items: [
    { label: "ユーザーを確認", href: "/admin/users", icon: "users" },
    { label: "企業を確認", href: "/admin/companies", icon: "building2" },
    { label: "求人・案件を確認", href: "/admin/opportunities", icon: "briefcase" },
    { label: "通報を確認", href: "/admin/reports", icon: "shieldAlert" },
    { label: "マスタ管理", href: "/admin/master-data", icon: "listChecks" },
  ],
} as const;
