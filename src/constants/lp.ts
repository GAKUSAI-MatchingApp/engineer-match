/**
 * Landing page placeholder content (Japanese).
 * Section copy is placeholder only — real content/business logic lands in later phases.
 */

export const BRAND = {
  name: "ENGINEER MATCH",
  subtitle: "エンジニア × IT企業 マッチングプラットフォーム",
} as const;

export const NAV_LINKS = [
  { label: "サービス", href: "/#services" },
  { label: "求人・案件", href: "/#opportunities" },
  { label: "企業の方へ", href: "/#for-companies" },
  { label: "ご利用の流れ", href: "/#how-it-works" },
  { label: "よくある質問", href: "/#faq" },
] as const;

export const HEADER_CTA = {
  login: "ログイン",
  primary: "無料登録",
} as const;

export const HERO = {
  eyebrow: "スキルで、企業とつながる。",
  title: "あなたのスキルに、\n本当に合う仕事を。",
  description:
    "就職・案件・時間精算まで。\nスキルや希望条件に合う求人・案件を探し、\n企業へ直接応募・連絡できる\nエンジニア向けマッチングプラットフォームです。",
  primaryCta: "求人・案件を探す",
  secondaryCta: "無料会員登録",
} as const;

/** Labels for the live counts in src/lib/landing/stats.ts, in display order. */
export const STATS_LABELS = {
  activeEngineerCount: "登録エンジニア数",
  publishedOpportunityCount: "掲載求人・案件数",
  activeCompanyCount: "参画企業数",
  activeSkillCount: "スキル登録数",
} as const;

export const SERVICES = {
  label: "SERVICE",
  title: "4つのサービス",
  description: "働き方や採用目的に合わせて、\n最適なサービスを選べます。",
} as const;

export const SERVICE_CATEGORIES = [
  {
    icon: "briefcase",
    name: "就職",
    description: "正社員・契約社員の採用求人",
    features: [
      "正社員・契約社員での採用",
      "書類選考から面接まで一貫サポート",
      "入社後のミスマッチを防止",
    ],
  },
  {
    icon: "folder",
    name: "案件",
    description: "固定報酬型の業務委託案件",
    features: [
      "成果物ベースの固定報酬",
      "リモート対応案件も多数",
      "契約条件を事前に確認可能",
    ],
  },
  {
    icon: "clock",
    name: "時間精算",
    description: "時間単価制の準委任案件",
    features: [
      "時間単価で明確な報酬",
      "稼働時間に応じた精算",
      "長期・安定案件が中心",
    ],
  },
  {
    icon: "building",
    name: "企業向け",
    description: "求人・案件掲載とエンジニア検索",
    features: [
      "求人・案件の掲載",
      "スキル条件でエンジニアを検索",
      "エンジニアへ直接アプローチ",
    ],
  },
] as const;

export const SKILLS = {
  label: "SKILLS",
  title: "人気のスキルから探す",
  description:
    "スキルや技術スタックから、\n自分に合った求人・案件を見つけられます。",
} as const;

export const SKILL_LIST = [
  "React",
  "Next.js",
  "TypeScript",
  "Java",
  "Spring Boot",
  "Python",
  "Django",
  "AWS",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MySQL",
  "Tailwind CSS",
  "Node.js",
  "Vue.js",
  "Angular",
  "Git",
  "Linux",
  "Azure",
  "GCP",
] as const;

export const FEATURED_OPPORTUNITIES = {
  label: "FEATURED",
  title: "注目の求人・案件",
  description: "現在募集中の求人・案件をご紹介します。",
  viewAllCta: "すべての求人・案件を見る",
} as const;

export const OPPORTUNITY_CTA_LABEL = "詳細を見る";

/**
 * Shown when listPublishedOpportunities() returns zero rows -- the normal
 * case for an anonymous visitor today, since opportunities_select_active
 * (024_opportunity_policies.sql) grants SELECT to `authenticated` only, not
 * `anon`. This is not an error state: it's RLS correctly hiding real listing
 * data from logged-out visitors until public browsing (a separately-tracked,
 * deferred decision) is implemented. Framed as a signup CTA rather than a
 * bare "no results" message, since for most visitors the true cause is "not
 * logged in" rather than "nothing is posted."
 */
export const FEATURED_OPPORTUNITIES_EMPTY = {
  title: "会員登録すると、掲載中の求人・案件をご覧いただけます。",
  description: "エンジニア登録は無料で、今すぐ求人・案件を検索できます。",
  ctaLabel: "無料会員登録",
} as const;

export const WHY_CHOOSE_US = {
  label: "ADVANTAGE",
  title: "選ばれる理由",
  description:
    "エンジニアと企業、\n双方にとって使いやすく、\n安心して利用できる\nマッチングプラットフォームを目指しています。",
} as const;

export const WHY_CHOOSE_US_ITEMS = [
  {
    icon: "handshake",
    title: "直接つながる",
    description: "気になる企業やエンジニアと、仲介を挟まず直接やり取りできます。",
  },
  {
    icon: "searchCheck",
    title: "スキルで検索",
    description:
      "得意な技術やスキルレベルから、条件に合った相手を効率よく探せます。",
  },
  {
    icon: "briefcase",
    title: "3つの契約形態",
    description: "就職・案件・時間精算まで、働き方に合わせて選べます。",
  },
  {
    icon: "shieldCheck",
    title: "安心の運営体制",
    description: "運営チームによるサポート体制で、安心してご利用いただけます。",
  },
] as const;

export const ITSS = {
  label: "ITSS",
  title: "ITSSレベルで\nスキルを見える化",
  description:
    "ITスキル標準（ITSS）を参考に、\nスキルレベルを7段階で登録・表示できます。\n企業は必要なレベルのエンジニアを探しやすくなります。",
  note: "※ レベルはスキルの目安として利用できます。",
} as const;

export const ITSS_LEVELS = [
  {
    level: 1,
    title: "エントリレベル",
    description: "指導を受けながら業務を遂行",
  },
  {
    level: 2,
    title: "基礎レベル",
    description: "一定の指導のもと業務を遂行",
  },
  {
    level: 3,
    title: "独り立ちレベル",
    description: "独力で要求作業を遂行",
  },
  {
    level: 4,
    title: "プロフェッショナルレベル",
    description: "専門知識で業務をリード",
  },
  {
    level: 5,
    title: "ハイスペシャリストレベル",
    description: "後進を指導できる専門性",
  },
  {
    level: 6,
    title: "エキスパートレベル",
    description: "卓越した知識と経験",
  },
  {
    level: 7,
    title: "トップレベル",
    description: "国内外で通用する第一人者",
  },
] as const;

export const ITSS_INFO_CARD = {
  title: "ITSSとは？",
  body: "ITSS（ITスキル標準）は、IT人材のスキルを体系的に整理した指標です。\n本サービスでは、スキルの目安として活用しています。",
  linkLabel: "IPA公式サイト",
  linkUrl: "https://www.ipa.go.jp/jinzai/skill-standard/plus-it-ui/itss/index.html",
} as const;

export const HOW_IT_WORKS = {
  label: "FLOW",
  title: "ご利用の流れ",
  description:
    "エンジニア・企業それぞれの利用手順を、\n4つのステップで分かりやすくご紹介します。",
  tabs: {
    engineer: "エンジニアの方",
    company: "企業の方",
  },
} as const;

export const HOW_IT_WORKS_STEPS = {
  engineer: [
    {
      icon: "userPlus",
      title: "無料会員登録",
      description: "メールアドレスだけで、今すぐ無料登録できます。",
    },
    {
      icon: "badgeCheck",
      title: "プロフィール・スキル登録",
      description: "経験やスキル、希望条件を登録してアピールします。",
    },
    {
      icon: "search",
      title: "求人・案件を検索して応募",
      description: "条件に合った求人・案件を探して直接応募できます。",
    },
    {
      icon: "messagesSquare",
      title: "チャットで選考・調整",
      description: "企業とチャットでやり取りしながら選考を進めます。",
    },
  ],
  company: [
    {
      icon: "building2",
      title: "企業アカウント登録",
      description: "会社情報を登録して、企業アカウントを開設します。",
    },
    {
      icon: "filePlus2",
      title: "求人・案件を掲載",
      description: "募集条件やスキル要件を設定して掲載します。",
    },
    {
      icon: "users",
      title: "応募者を確認・管理",
      description: "応募のあったエンジニアの情報を一覧で確認できます。",
    },
    {
      icon: "messageCircle",
      title: "チャットで選考・調整",
      description: "エンジニアと直接チャットでやり取りし、選考を進めます。",
    },
  ],
} as const;

export const FOR_COMPANIES = {
  label: "FOR COMPANIES",
  title: "採用・案件募集を、\nもっと効率的に。",
  description:
    "求人・案件の掲載から応募者管理、\nエンジニア検索、チャットまで。\n採用活動を一つのプラットフォームで管理できます。",
  cta: "企業として無料登録",
} as const;

export const FOR_COMPANIES_FEATURES = [
  {
    icon: "briefcase",
    title: "求人・案件掲載",
    description: "就職・案件・時間精算の募集情報を登録・管理できます。",
  },
  {
    icon: "searchCheck",
    title: "スキルで検索",
    description: "スキル・経験・希望条件から候補エンジニアを探せます。",
  },
  {
    icon: "usersRound",
    title: "応募者管理",
    description: "応募状況や選考ステータスを一元管理できます。",
  },
] as const;

export const FAQ = {
  label: "FAQ",
  title: "よくある質問",
  description: "サービスに関する\nよくあるご質問をまとめました。",
} as const;

export const FAQ_ITEMS = [
  {
    question: "利用料金はかかりますか？",
    answer:
      "求職者（エンジニア）の登録・求人検索は無料です。\n求人者（企業）は月額10,000円（税別）のサブスクリプションでご利用いただけます。",
  },
  {
    question: "どのような契約形態がありますか？",
    answer: "就職・案件・時間精算の\n3つの契約形態に対応しています。",
  },
  {
    question: "企業と直接やり取りできますか？",
    answer: "応募後はチャット機能を通じて\n企業と直接連絡できます。",
  },
  {
    question: "プロフィールは後から変更できますか？",
    answer: "プロフィール・スキル・職務経歴は\nいつでも更新できます。",
  },
  {
    question: "企業は求人を掲載できますか？",
    answer: "企業アカウントから\n求人・案件を掲載できます。",
  },
  {
    question: "退会できますか？",
    answer: "アカウント設定から\nいつでも退会できます。",
  },
] as const;

export const CTA = {
  label: "GET STARTED",
  title: "あなたに合う仕事、\nここから始まる。",
  description:
    "就職・案件・時間精算まで。\n\nエンジニアと企業を\nもっとシンプルにつなぎます。",
  primaryCta: "エンジニアとして登録",
  primaryHref: "/signup",
  secondaryCta: "企業として登録",
  secondaryHref: "/signup?role=company",
} as const;

export const FOOTER = {
  description:
    "ENGINEER MATCHは、エンジニアとIT企業を結ぶマッチングプラットフォームです。",
  columns: [
    {
      title: "サービス",
      links: [
        { label: "サービス概要", href: "/#services" },
        { label: "スキルから探す", href: "/#skills" },
        { label: "求人・案件を探す", href: "/#opportunities" },
        { label: "ITSS（スキル標準）", href: "/#itss" },
      ],
    },
    {
      title: "企業向け",
      links: [
        { label: "企業の方へ", href: "/#for-companies" },
        { label: "ご利用の流れ", href: "/#how-it-works" },
        { label: "料金プラン", href: "/pricing" },
        // No standalone case-studies page yet -- routed to "why choose us",
        // the closest existing section (social proof / platform strengths).
        { label: "導入事例", href: "/#why-us" },
      ],
    },
    {
      title: "サポート",
      links: [
        { label: "よくある質問", href: "/#faq" },
        { label: "お問い合わせ", href: "/contact" },
        // No standalone help-center page yet -- routed to the real,
        // functioning inquiry page rather than a marketing section.
        { label: "ヘルプセンター", href: "/contact" },
      ],
    },
    {
      title: "会社情報",
      links: [
        { label: "運営会社", href: "/company" },
        { label: "利用規約", href: "/terms" },
        { label: "プライバシーポリシー", href: "/privacy" },
      ],
    },
  ],
} as const;
