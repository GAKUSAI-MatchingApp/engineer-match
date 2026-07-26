/**
 * Login / Registration placeholder content (Japanese).
 * UI only — no backend, no validation logic, no API calls.
 */

export const LOGIN_VISUAL = {
  imageSrc: "/image/ChatGPT Image Jul 13, 2026, 04_44_59 PM office.png",
  imageAlt: "光が差し込むモダンなオフィスの様子",
  title: "スキルで、\n未来をつなぐ。",
  description:
    "エンジニアとIT企業をつなぐ、\n信頼のマッチングプラットフォーム。",
  bullets: ["企業と直接つながる", "スキルで探せる", "安心のサポート"] as const,
} as const;

export const LOGIN_FORM = {
  title: "ログイン",
  description: "アカウントにログインして、続きから始めましょう。",
  email: { label: "メールアドレス", placeholder: "example@company.co.jp" },
  password: { label: "パスワード", placeholder: "••••••••" },
  rememberMe: "ログイン状態を保持する",
  forgotPassword: "パスワードをお忘れですか？",
  submitLabel: "ログイン",
  loadingLabel: "ログイン中…",
  dividerLabel: "または",
  google: "Googleでログイン",
  github: "GitHubでログイン",
  noAccount: "アカウントをお持ちでない方",
  registerCta: "無料登録",
  registerHref: "/signup",
} as const;

export const LOGIN_ROLE_LABEL = "ログインするアカウント種別";

export const LOGIN_ROLE_OPTIONS = {
  engineer: {
    value: "engineer",
    title: "エンジニア",
    description: "求人・案件を探す",
  },
  company: {
    value: "company",
    title: "企業",
    description: "求人・案件を掲載する",
  },
  admin: {
    value: "admin",
    title: "管理者",
    description: "プラットフォーム全体を管理します。",
  },
} as const;

export const LOGIN_ERRORS = {
  roleRequired: "ログインするアカウント種別を選択してください。",
  invalidCredentials: "メールアドレスまたはパスワードが正しくありません。",
  emailNotConfirmed:
    "メールアドレスの確認が完了していません。届いた確認メールのリンクをクリックしてください。",
  missingProfile:
    "アカウント情報の取得に失敗しました。しばらくしてから再度お試しいただくか、サポートまでお問い合わせください。",
  instructorNotAvailable:
    "講師アカウントでのログインは現在準備中です。もうしばらくお待ちください。",
  unsupportedRole:
    "このアカウント種別はサポートされていません。管理者までお問い合わせください。",
  unexpected: "通信エラーが発生しました。しばらくしてから再度お試しください。",
} as const;

/**
 * Dev-only convenience: autofills the login form with a seeded test
 * account. Gated to non-production builds in LoginCard -- never rendered
 * in production, since these are real credentials against real auth.
 */
export const LOGIN_DEMO_HELPER = {
  title: "デモアカウント（開発用）",
  fillButtonLabel: "デモ情報を入力",
} as const;

export const AUTH_DEMO_ACTION_NOTICE = "※ この機能は現在ご利用いただけません。";

export const REGISTER_VISUAL = {
  imageSrc: "/image/ChatGPT Image Jul 13, 2026, 04_43_45 PM developer .png",
  imageAlt: "デスクでコードと向き合うエンジニアの様子",
  title: "今日から、\n新しいキャリアを。",
  description:
    "無料登録で、あなたに合った\n求人・案件と出会えましょう。",
  bullets: ["企業と直接つながる", "スキルで探せる", "安心のサポート"] as const,
} as const;

export const REGISTER_AUTH_NOTICE = {
  line1: "こちらは本登録です。実際にアカウントが作成されます。",
  line2: "入力内容は安全に保存され、以後のログインに利用されます。",
} as const;

export const REGISTER_FORM = {
  title: "アカウント登録",
  description: "まずはアカウント種別をお選びください。",
  loadingLabel: "登録中…",
  accountTypeLabel: "アカウント種別",
  accountTypes: {
    engineer: {
      value: "engineer",
      title: "エンジニアとして登録",
      description: "求人・案件を探す",
    },
    company: {
      value: "company",
      title: "企業として登録",
      description: "求人・案件を掲載する",
    },
  },
  backLabel: "アカウント種別を変更する",
  engineerFields: {
    name: { label: "お名前", placeholder: "山田 太郎" },
    email: { label: "メールアドレス", placeholder: "example@mail.com" },
    password: { label: "パスワード", placeholder: "••••••••" },
    confirmPassword: { label: "パスワード（確認）", placeholder: "••••••••" },
    submitLabel: "エンジニアとして登録",
  },
  companyFields: {
    companyName: { label: "会社名", placeholder: "株式会社サンプル" },
    representative: { label: "代表者", placeholder: "山田 太郎" },
    email: { label: "メールアドレス", placeholder: "example@company.co.jp" },
    password: { label: "パスワード", placeholder: "••••••••" },
    confirmPassword: { label: "パスワード（確認）", placeholder: "••••••••" },
    submitLabel: "企業として登録",
  },
  agreeTermsTermsLabel: "利用規約",
  agreeTermsMiddle: "および",
  agreeTermsPrivacyLabel: "プライバシーポリシー",
  agreeTermsSuffix: "に同意します",
  hasAccount: "すでにアカウントをお持ちの方",
  loginCta: "ログイン",
  loginHref: "/login",
} as const;

export const REGISTER_ERRORS = {
  adminNotAllowed:
    "管理者アカウントは登録できません。「エンジニア」または「企業」のみご登録いただけます。",
  roleRequired:
    "アカウント種別を確認できませんでした。お手数ですが、アカウント種別を選び直してください。",
  passwordMismatch: "パスワードが一致しません。もう一度ご確認ください。",
  emailInUse:
    "このメールアドレスはすでに登録されています。ログイン画面からログインしてください。",
  weakPassword:
    "パスワードの強度が不十分です。8文字以上で、英字と数字を組み合わせて入力してください。",
  invalidEmail:
    "メールアドレスの形式が正しくありません。ご確認のうえ、再度入力してください。",
  rateLimited:
    "リクエストが集中しています。しばらく時間をおいてから再度お試しください。",
  instructorNotAvailable:
    "講師アカウントでのご利用は現在準備中です。もうしばらくお待ちください。",
  missingProfile:
    "アカウント情報の取得に失敗しました。しばらくしてから再度お試しいただくか、サポートまでお問い合わせください。",
  network:
    "通信エラーが発生しました。ネットワーク接続をご確認のうえ、再度お試しください。",
  unexpected: "登録処理中にエラーが発生しました。しばらくしてから再度お試しください。",
} as const;

export const REGISTER_EMAIL_CONFIRMATION = {
  title: "確認メールを送信しました。",
  note: "受信したメール内のリンクをクリックして、登録を完了してください。",
  loginCta: "ログイン画面へ",
} as const;
