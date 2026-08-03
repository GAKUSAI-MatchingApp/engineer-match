/**
 * Repeatable demo-data seed script: 100 Engineer + 100 Company accounts with
 * realistic Japanese identity/profile data, for QA/demo environments only.
 *
 * WHAT IT CREATES (per account)
 *   auth.users            via supabase.auth.admin.createUser() (service role)
 *   public.users          auto-created by the on_auth_user_created trigger
 *                          (002_users.sql) from user_metadata.role/name --
 *                          status defaults to 'ACTIVE' at the table level.
 *   Engineer accounts also get:
 *   public.engineer_profiles            (required fields per the
 *                                        trg_engineer_profiles_required_fields
 *                                        trigger, 065_access_and_profile_integrity_hardening.sql)
 *   public.engineer_contact_details     (phone, nearest station)
 *   public.engineer_personal_info       (birth date, gender)
 *   public.user_skills                  (3-6 real technical skills w/ level 1-7)
 *   public.engineer_preferred_contract_types
 *   public.engineer_preferred_locations
 *   Company accounts also get:
 *   public.company_profiles             (name, address, industry, size, etc.)
 *
 * Deliberately NOT seeded (kept out of scope; ask if you want these too):
 *   work_experiences, educations, languages, portfolio_projects,
 *   user_qualifications, skill_assessment_attempts (Human/Business diagnostics),
 *   engineer_reviews.
 *
 * SAFETY / REPEATABILITY
 *   - Faker is seeded with a fixed value, so the generated dataset (names,
 *     emails, everything) is identical on every run.
 *   - DRY RUN BY DEFAULT. Generates and validates all data, prints a summary,
 *     and makes ZERO network calls to Supabase unless --commit is passed.
 *   - Idempotent: before creating anything, it reads which of the generated
 *     emails already exist in public.users and skips them -- safe to re-run
 *     against a partially-seeded or already-seeded database.
 *   - Every account is created with email_confirm: true and is immediately
 *     ACTIVE (the public.users default) -- no manual confirmation step.
 *   - Not transactional: if a later step for one account fails (e.g. the
 *     skills insert), the auth user and any earlier rows for that account
 *     already exist. The email-existence check means a re-run will then
 *     SKIP that account rather than retry it. Failed emails are printed at
 *     the end -- re-run with a narrower --engineers/--companies range, or
 *     clean up that one account manually, if you see any.
 *
 * REQUIRED ENV (never committed -- put these in .env.local, which is
 * gitignored; NEXT_PUBLIC_SUPABASE_URL is already there)
 *   NEXT_PUBLIC_SUPABASE_URL     (already present)
 *   SUPABASE_SERVICE_ROLE_KEY    (Project Settings -> API -> service_role.
 *                                 NOT the anon key. Required to call the
 *                                 auth admin API and to bypass RLS for the
 *                                 profile-table inserts below.)
 *   SEED_ACCOUNT_PASSWORD        (optional -- shared login password for every
 *                                 seeded account; defaults to a fixed demo
 *                                 password if unset, printed in the summary.)
 *
 * USAGE
 *   npm run seed:demo                 # dry run -- prints a summary, writes nothing
 *   npm run seed:demo -- --commit     # actually creates the 200 accounts
 *   npm run seed:demo -- --commit --engineers=10 --companies=10   # smaller batch
 */

// dotenv/config on its own only loads a file literally named ".env" -- this
// project's convention (matching Next.js) is ".env.local", so the path must
// be given explicitly or none of these variables would ever be found.
import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fakerJA as faker } from "@faker-js/faker";

loadEnv({ path: ".env.local" });

// ============================================================
// CLI args
// ============================================================

const args = new Set(process.argv.slice(2));
const COMMIT = args.has("--commit");

function intArg(name: string, fallback: number): number {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((a) => a.startsWith(prefix));
  if (!found) return fallback;
  const value = Number(found.slice(prefix.length));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

const ENGINEER_COUNT = intArg("engineers", intArg("count", 100));
const COMPANY_COUNT = intArg("companies", intArg("count", 100));

// ============================================================
// Env
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// No hardcoded fallback, deliberately: a password literal in source would be
// committed to git the moment this file is. Required (fail fast) for
// --commit; dry-run works without it (see the "(not set)" placeholder below).
const SEED_PASSWORD = process.env.SEED_ACCOUNT_PASSWORD;
const EMAIL_DOMAIN = "engineer-match.jp";

if (COMMIT) {
  if (!SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (set it in .env.local).");
  }
  if (!SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local (Project Settings " +
        "-> API -> service_role key in the Supabase dashboard). Never commit this value.",
    );
  }
  if (!SEED_PASSWORD) {
    throw new Error(
      "Missing SEED_ACCOUNT_PASSWORD. Add it to .env.local -- choose a password meeting " +
        "Supabase's minimum policy and set it there. Never hardcode it in source.",
    );
  }
}

// Two distinct seeds, applied immediately before each group's generation
// loop (see main()) rather than once globally. faker draws are sequential,
// so a single shared seed makes company output depend on how many random
// calls engineer generation happened to consume first -- i.e. changing
// --engineers would silently change every company record too. Reseeding
// per-group makes each group's output a pure function of its own count.
const ENGINEER_SEED = 20260803;
const COMPANY_SEED = 20260804;

// ============================================================
// Curated Japanese name / content data banks
// (Faker drives every random *selection* below; the pools themselves are
// hand-curated so the displayed kanji name and the email's romaji local
// part always refer to the same person -- faker's own name corpus can't be
// mapped back to romaji reliably.)
// ============================================================

interface NamePart {
  kanji: string;
  romaji: string;
}

const FAMILY_NAMES: NamePart[] = [
  { kanji: "佐藤", romaji: "sato" },
  { kanji: "鈴木", romaji: "suzuki" },
  { kanji: "高橋", romaji: "takahashi" },
  { kanji: "田中", romaji: "tanaka" },
  { kanji: "渡辺", romaji: "watanabe" },
  { kanji: "伊藤", romaji: "ito" },
  { kanji: "山本", romaji: "yamamoto" },
  { kanji: "中村", romaji: "nakamura" },
  { kanji: "小林", romaji: "kobayashi" },
  { kanji: "加藤", romaji: "kato" },
  { kanji: "吉田", romaji: "yoshida" },
  { kanji: "山田", romaji: "yamada" },
  { kanji: "佐々木", romaji: "sasaki" },
  { kanji: "山口", romaji: "yamaguchi" },
  { kanji: "松本", romaji: "matsumoto" },
  { kanji: "井上", romaji: "inoue" },
  { kanji: "木村", romaji: "kimura" },
  { kanji: "林", romaji: "hayashi" },
  { kanji: "清水", romaji: "shimizu" },
  { kanji: "斎藤", romaji: "saito" },
  { kanji: "阿部", romaji: "abe" },
  { kanji: "森", romaji: "mori" },
  { kanji: "池田", romaji: "ikeda" },
  { kanji: "橋本", romaji: "hashimoto" },
  { kanji: "石川", romaji: "ishikawa" },
  { kanji: "前田", romaji: "maeda" },
  { kanji: "藤田", romaji: "fujita" },
  { kanji: "後藤", romaji: "goto" },
  { kanji: "岡田", romaji: "okada" },
  { kanji: "長谷川", romaji: "hasegawa" },
  { kanji: "村上", romaji: "murakami" },
  { kanji: "近藤", romaji: "kondo" },
  { kanji: "石井", romaji: "ishii" },
  { kanji: "坂本", romaji: "sakamoto" },
  { kanji: "遠藤", romaji: "endo" },
  { kanji: "青木", romaji: "aoki" },
  { kanji: "藤井", romaji: "fujii" },
  { kanji: "西村", romaji: "nishimura" },
  { kanji: "福田", romaji: "fukuda" },
  { kanji: "太田", romaji: "ota" },
];

const MALE_GIVEN_NAMES: NamePart[] = [
  { kanji: "太郎", romaji: "taro" },
  { kanji: "翔太", romaji: "shota" },
  { kanji: "健太", romaji: "kenta" },
  { kanji: "大輔", romaji: "daisuke" },
  { kanji: "拓也", romaji: "takuya" },
  { kanji: "直樹", romaji: "naoki" },
  { kanji: "陽介", romaji: "yosuke" },
  { kanji: "亮", romaji: "ryo" },
  { kanji: "駿", romaji: "shun" },
  { kanji: "颯太", romaji: "sota" },
  { kanji: "悠斗", romaji: "yuto" },
  { kanji: "蓮", romaji: "ren" },
  { kanji: "海斗", romaji: "kaito" },
  { kanji: "浩", romaji: "hiroshi" },
  { kanji: "誠", romaji: "makoto" },
  { kanji: "隆", romaji: "takashi" },
  { kanji: "淳", romaji: "jun" },
  { kanji: "和也", romaji: "kazuya" },
  { kanji: "祐介", romaji: "yusuke" },
  { kanji: "健一", romaji: "kenichi" },
  { kanji: "修", romaji: "osamu" },
  { kanji: "亮太", romaji: "ryota" },
  { kanji: "翼", romaji: "tsubasa" },
  { kanji: "陸", romaji: "riku" },
];

const FEMALE_GIVEN_NAMES: NamePart[] = [
  { kanji: "花子", romaji: "hanako" },
  { kanji: "美咲", romaji: "misaki" },
  { kanji: "結衣", romaji: "yui" },
  { kanji: "陽菜", romaji: "hina" },
  { kanji: "さくら", romaji: "sakura" },
  { kanji: "愛", romaji: "ai" },
  { kanji: "由香", romaji: "yuka" },
  { kanji: "麻衣", romaji: "mai" },
  { kanji: "彩", romaji: "aya" },
  { kanji: "真由美", romaji: "mayumi" },
  { kanji: "恵", romaji: "megumi" },
  { kanji: "千尋", romaji: "chihiro" },
  { kanji: "七海", romaji: "nanami" },
  { kanji: "美穂", romaji: "miho" },
  { kanji: "友美", romaji: "tomomi" },
  { kanji: "香織", romaji: "kaori" },
  { kanji: "沙織", romaji: "saori" },
  { kanji: "菜々子", romaji: "nanako" },
  { kanji: "美優", romaji: "miyu" },
  { kanji: "由美", romaji: "yumi" },
];

const COMPANY_NAME_ROOTS = [
  "ネクスト", "クラウド", "デジタル", "スマート", "グローバル", "アルファ",
  "ブライト", "フロンティア", "テクノ", "イノベーション", "ブルー", "グリーン",
  "サン", "リンク", "コア", "アクト", "ライズ", "シフト", "ユナイト", "ヴィジョン",
];

const COMPANY_NAME_SUFFIXES = [
  "テクノロジーズ", "ソリューションズ", "システムズ", "ラボ", "ワークス",
  "コンサルティング", "デザイン", "メディア", "パートナーズ", "イノベーションズ",
  "ネットワークス", "デベロップメント",
];

const STATIONS = [
  "新宿駅", "渋谷駅", "東京駅", "品川駅", "池袋駅", "上野駅", "秋葉原駅",
  "横浜駅", "川崎駅", "大宮駅", "梅田駅", "難波駅", "天王寺駅", "三宮駅",
  "名古屋駅", "栄駅", "博多駅", "天神駅", "札幌駅", "仙台駅", "広島駅",
  "京都駅", "四条駅", "中洲川端駅", "赤坂駅", "六本木駅", "五反田駅",
];

const JOB_CATEGORY_LABELS: Record<string, string> = {
  FRONTEND: "フロントエンドエンジニア",
  BACKEND: "バックエンドエンジニア",
  FULLSTACK: "フルスタックエンジニア",
  INFRA: "インフラエンジニア",
  CLOUD: "クラウドエンジニア",
  AI_DATA: "データ・AIエンジニア",
  PM: "プロジェクトマネージャー",
  QA: "QAエンジニア",
  SECURITY: "セキュリティエンジニア",
};
const JOB_CATEGORIES = Object.keys(JOB_CATEGORY_LABELS);

const WORK_STYLES = ["REMOTE", "ONSITE", "HYBRID"] as const;
const AVAILABILITY_STATUSES = [
  "IMMEDIATE",
  "NEGOTIABLE",
  "CURRENTLY_EMPLOYED",
  "ON_LEAVE",
] as const;
const GENDERS = ["MALE", "FEMALE", "UNSPECIFIED"] as const;
const CONTRACT_TYPES = ["EMPLOYMENT", "PROJECT", "HOURLY"] as const;
const COMPANY_SIZES = ["1-10", "11-50", "51-100", "101-300", "301-1000", "1001+"] as const;

const SELF_PR_TEMPLATES = [
  (jobLabel: string, years: number, skills: string[]) =>
    `${jobLabel}として約${years}年の実務経験があります。${skills.join("、")}を中心に、要件定義から実装・運用まで一貫して携わってきました。チームでの円滑なコミュニケーションを大切にしています。`,
  (jobLabel: string, years: number, skills: string[]) =>
    `${skills.join("、")}を用いた開発を得意とする${jobLabel}です。これまで約${years}年、複数のプロジェクトで設計・実装・テストを担当し、保守性の高いコードを書くことを心がけています。`,
  (jobLabel: string, years: number, skills: string[]) =>
    `約${years}年間、${jobLabel}として${skills.join("、")}を活用した開発に従事してきました。仕様の整理から本番リリースまで、一貫して品質にこだわって取り組んでいます。`,
  (jobLabel: string, years: number, skills: string[]) =>
    `${jobLabel}歴${years}年。${skills.join("、")}を軸に、スタートアップから大規模サービスまで幅広い開発経験があります。新しい技術のキャッチアップにも積極的です。`,
];

const BUSINESS_DESCRIPTION_TEMPLATES = [
  (industry: string) =>
    `${industry}分野を中心に、企画・開発から運用まで一貫したサービスを提供する架空の企業です。少数精鋭のチームで、質の高いプロダクト作りに取り組んでいます。`,
  (industry: string) =>
    `${industry}領域でのDX推進を支援する架空の企業です。お客様の課題に寄り添い、要件整理から設計・開発・運用までワンストップで対応しています。`,
  (industry: string) =>
    `${industry}に特化したプロダクト・サービスを展開する架空の企業です。エンジニアが裁量を持って開発に取り組める環境づくりを大切にしています。`,
];

// ============================================================
// Small helpers
// ============================================================

function randomBetween(min: number, max: number): number {
  return faker.number.int({ min, max });
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface GeneratedPerson {
  kanjiFullName: string;
  emailLocalRoot: string;
  gender: (typeof GENDERS)[number];
}

function generatePerson(): GeneratedPerson {
  const isMale = faker.datatype.boolean();
  const family = faker.helpers.arrayElement(FAMILY_NAMES);
  const given = faker.helpers.arrayElement(isMale ? MALE_GIVEN_NAMES : FEMALE_GIVEN_NAMES);
  const gender: (typeof GENDERS)[number] = faker.helpers.weightedArrayElement([
    { value: isMale ? GENDERS[0] : GENDERS[1], weight: 9 },
    { value: GENDERS[2], weight: 1 },
  ]);
  return {
    kanjiFullName: `${family.kanji} ${given.kanji}`,
    emailLocalRoot: `${given.romaji}.${family.romaji}`,
    gender,
  };
}

function generateJapanesePhone(): string {
  const prefix = faker.helpers.arrayElement(["070", "080", "090"]);
  const mid = String(randomBetween(1000, 9999));
  const last = String(randomBetween(1000, 9999));
  return `${prefix}-${mid}-${last}`;
}

/** Regenerates on collision so the ~100 company names actually seeded stay distinct. */
function generateUniqueCompanyName(alreadyUsed: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const root = faker.helpers.arrayElement(COMPANY_NAME_ROOTS);
    const suffix = faker.helpers.arrayElement(COMPANY_NAME_SUFFIXES);
    // Most real companies are 前株 (株式会社 prefix); keep a minority 後株 for variety.
    const name = faker.datatype.boolean({ probability: 0.85 })
      ? `株式会社${root}${suffix}`
      : `${root}${suffix}株式会社`;
    if (!alreadyUsed.has(name)) {
      alreadyUsed.add(name);
      return name;
    }
  }
  // 20 roots x 12 suffixes x 2 styles = 480 combos, so this is unreachable at
  // 100 companies -- kept only as a hang-proof fallback.
  const fallback = `株式会社${faker.helpers.arrayElement(COMPANY_NAME_ROOTS)}${randomBetween(100, 999)}`;
  alreadyUsed.add(fallback);
  return fallback;
}

function slugify(romaji: string): string {
  return romaji.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

// ============================================================
// Master data (names must match 033_skill_qualification_master_data.sql /
// 064_industry_categories.sql exactly -- looked up by name -> id below, not
// hardcoded UUIDs, since ids are gen_random_uuid() and differ per project).
// ============================================================

const TECHNICAL_SKILL_NAMES = [
  "React", "TypeScript", "Next.js", "Java", "Spring Boot", "Python",
  "Node.js", "Go", "GraphQL", "AWS", "Docker", "Kubernetes",
  "PostgreSQL", "MySQL",
];

const INDUSTRY_NAMES = [
  "IT・ソフトウェア", "インターネット・Web", "通信", "コンサルティング",
  "金融・FinTech", "製造", "医療・ヘルスケア", "教育", "人材・HR", "不動産",
  "小売・EC", "物流", "広告・メディア", "ゲーム・エンタメ", "官公庁・公共", "その他",
];

// ============================================================
// Record generation (pure -- no I/O). Same code path for dry-run preview
// and for the real --commit inserts, so what you see in the dry run is
// exactly what gets written.
// ============================================================

interface EngineerRecord {
  email: string;
  name: string;
  password: string;
  profile: {
    prefecture: string;
    years_of_experience: number;
    self_pr: string;
    work_style: (typeof WORK_STYLES)[number];
    desired_rate_min: number;
    desired_rate_max: number;
    portfolio_url: string;
    github_url: string;
    is_public: boolean;
    job_title: string;
    job_category: string;
    availability_status: (typeof AVAILABILITY_STATUSES)[number];
    desired_annual_income_min: number;
    desired_annual_income_max: number;
    desired_hourly_rate_min: number;
    desired_hourly_rate_max: number;
    available_from: string;
  };
  contact: { phone: string; nearest_station: string };
  personal: { birth_date: string; gender: (typeof GENDERS)[number] };
  skills: { skillName: string; level: number; experienceYears: number }[];
  preferredContractTypes: string[];
  preferredLocations: string[];
}

interface CompanyRecord {
  email: string;
  name: string;
  password: string;
  profile: {
    company_name: string;
    prefecture: string;
    address: string;
    business_description: string;
    website_url: string;
    contact_person: string;
    company_size: string;
    industry: string;
    established_year: number;
  };
}

function generateEngineerRecord(index: number, password: string): EngineerRecord {
  const person = generatePerson();
  const email = `${person.emailLocalRoot}${String(index).padStart(4, "0")}@${EMAIL_DOMAIN}`;

  const jobCategory = faker.helpers.arrayElement(JOB_CATEGORIES);
  const jobLabel = JOB_CATEGORY_LABELS[jobCategory];
  const years = randomBetween(1, 20);
  const pickedSkills = faker.helpers.arrayElements(TECHNICAL_SKILL_NAMES, {
    min: 3,
    max: 6,
  });
  const selfPrTemplate = faker.helpers.arrayElement(SELF_PR_TEMPLATES);
  const slug = slugify(`${person.emailLocalRoot}${index}`);

  const rateMin = randomBetween(30, 70);
  const rateMax = rateMin + randomBetween(10, 30);
  const annualMin = randomBetween(400, 800);
  const annualMax = annualMin + randomBetween(50, 200);
  const hourlyMin = randomBetween(3000, 6000);
  const hourlyMax = hourlyMin + randomBetween(500, 2000);

  return {
    email,
    name: person.kanjiFullName,
    password,
    profile: {
      prefecture: faker.location.state(),
      years_of_experience: years,
      self_pr: selfPrTemplate(jobLabel, years, pickedSkills.slice(0, 2)),
      work_style: faker.helpers.arrayElement(WORK_STYLES),
      desired_rate_min: rateMin,
      desired_rate_max: rateMax,
      portfolio_url: `https://example.com/${slug}/portfolio`,
      github_url: `https://example.com/${slug}/github`,
      is_public: faker.datatype.boolean({ probability: 0.9 }),
      job_title: jobLabel,
      job_category: jobCategory,
      availability_status: faker.helpers.arrayElement(AVAILABILITY_STATUSES),
      desired_annual_income_min: annualMin,
      desired_annual_income_max: annualMax,
      desired_hourly_rate_min: hourlyMin,
      desired_hourly_rate_max: hourlyMax,
      available_from: toDateOnly(faker.date.soon({ days: 90 })),
    },
    contact: {
      phone: generateJapanesePhone(),
      nearest_station: faker.helpers.arrayElement(STATIONS),
    },
    personal: {
      birth_date: toDateOnly(faker.date.birthdate({ min: 22, max: 58, mode: "age" })),
      gender: person.gender,
    },
    skills: pickedSkills.map((skillName) => ({
      skillName,
      level: randomBetween(1, 7),
      experienceYears: randomBetween(0, Math.max(1, Math.min(years, 15))),
    })),
    preferredContractTypes: faker.helpers.arrayElements(CONTRACT_TYPES, {
      min: 1,
      max: 3,
    }),
    preferredLocations: faker.helpers.arrayElements(
      [...new Set([faker.location.state(), faker.location.state(), "フルリモート"])],
      { min: 1, max: 3 },
    ),
  };
}

function generateCompanyRecord(
  index: number,
  password: string,
  usedCompanyNames: Set<string>,
): CompanyRecord {
  const contactPerson = generatePerson();
  const email = `hr.${contactPerson.emailLocalRoot}${String(index).padStart(4, "0")}@${EMAIL_DOMAIN}`;
  const companyName = generateUniqueCompanyName(usedCompanyNames);
  const industry = faker.helpers.arrayElement(INDUSTRY_NAMES);
  const prefecture = faker.location.state();
  const descriptionTemplate = faker.helpers.arrayElement(BUSINESS_DESCRIPTION_TEMPLATES);
  const slug = slugify(`${contactPerson.emailLocalRoot}${index}`);
  const currentYear = new Date().getFullYear();

  return {
    email,
    name: companyName,
    password,
    profile: {
      company_name: companyName,
      prefecture,
      address: `${prefecture}${faker.location.city()}${faker.location.streetAddress()}`,
      business_description: descriptionTemplate(industry),
      website_url: `https://example.com/${slug}`,
      contact_person: contactPerson.kanjiFullName,
      company_size: faker.helpers.arrayElement(COMPANY_SIZES),
      industry,
      established_year: randomBetween(currentYear - 30, currentYear - 1),
    },
  };
}

// ============================================================
// Concurrency-limited map (no extra dependency for a one-off script).
// ============================================================

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function runNext(): Promise<void> {
    const current = cursor++;
    if (current >= items.length) return;
    results[current] = await worker(items[current], current);
    return runNext();
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
  return results;
}

// ============================================================
// Commit-mode DB writes
// ============================================================

interface SeedOutcome {
  email: string;
  status: "created" | "skipped_existing" | "failed";
  error?: string;
}

async function fetchNameToIdMap(
  supabase: SupabaseClient,
  table: string,
  names: string[],
): Promise<Map<string, string>> {
  const { data, error } = await supabase.from(table).select("id, name").in("name", names);
  if (error) {
    throw new Error(`Failed to load ${table}: ${error.message}`);
  }
  const map = new Map<string, string>((data ?? []).map((row) => [row.name as string, row.id as string]));
  const missing = names.filter((name) => !map.has(name));
  if (missing.length > 0) {
    throw new Error(
      `${table} is missing expected seed rows: ${missing.join(", ")}. ` +
        `Run the base migrations (033_skill_qualification_master_data.sql / ` +
        `064_industry_categories.sql) before seeding demo accounts.`,
    );
  }
  return map;
}

async function createEngineer(
  supabase: SupabaseClient,
  record: EngineerRecord,
  skillIdByName: Map<string, string>,
): Promise<SeedOutcome> {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: record.email,
    password: record.password,
    email_confirm: true,
    user_metadata: { role: "ENGINEER", name: record.name },
  });
  if (createError || !created.user) {
    return { email: record.email, status: "failed", error: createError?.message };
  }
  const userId = created.user.id;

  const { error: profileError } = await supabase
    .from("engineer_profiles")
    .upsert({ id: userId, ...record.profile }, { onConflict: "id" });
  if (profileError) {
    return { email: record.email, status: "failed", error: profileError.message };
  }

  const { error: contactError } = await supabase
    .from("engineer_contact_details")
    .upsert({ id: userId, ...record.contact }, { onConflict: "id" });
  if (contactError) {
    return { email: record.email, status: "failed", error: contactError.message };
  }

  const { error: personalError } = await supabase
    .from("engineer_personal_info")
    .upsert({ id: userId, ...record.personal }, { onConflict: "id" });
  if (personalError) {
    return { email: record.email, status: "failed", error: personalError.message };
  }

  const skillRows = record.skills.map((skill) => ({
    user_id: userId,
    skill_id: skillIdByName.get(skill.skillName),
    skill_level: skill.level,
    experience_years: skill.experienceYears,
  }));
  const { error: skillsError } = await supabase.from("user_skills").insert(skillRows);
  if (skillsError) {
    return { email: record.email, status: "failed", error: skillsError.message };
  }

  const { error: contractTypesError } = await supabase
    .from("engineer_preferred_contract_types")
    .insert(
      record.preferredContractTypes.map((contract_type) => ({
        user_id: userId,
        contract_type,
      })),
    );
  if (contractTypesError) {
    return { email: record.email, status: "failed", error: contractTypesError.message };
  }

  const { error: locationsError } = await supabase
    .from("engineer_preferred_locations")
    .insert(record.preferredLocations.map((location) => ({ user_id: userId, location })));
  if (locationsError) {
    return { email: record.email, status: "failed", error: locationsError.message };
  }

  return { email: record.email, status: "created" };
}

async function createCompany(
  supabase: SupabaseClient,
  record: CompanyRecord,
  industryIdByName: Map<string, string>,
): Promise<SeedOutcome> {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: record.email,
    password: record.password,
    email_confirm: true,
    user_metadata: { role: "COMPANY", name: record.name },
  });
  if (createError || !created.user) {
    return { email: record.email, status: "failed", error: createError?.message };
  }
  const userId = created.user.id;

  const { error: profileError } = await supabase.from("company_profiles").upsert(
    {
      id: userId,
      ...record.profile,
      industry_category_id: industryIdByName.get(record.profile.industry) ?? null,
    },
    { onConflict: "id" },
  );
  if (profileError) {
    return { email: record.email, status: "failed", error: profileError.message };
  }

  return { email: record.email, status: "created" };
}

// ============================================================
// Main
// ============================================================

function summarize(label: string, outcomes: SeedOutcome[]) {
  const created = outcomes.filter((o) => o.status === "created").length;
  const skipped = outcomes.filter((o) => o.status === "skipped_existing").length;
  const failed = outcomes.filter((o) => o.status === "failed");
  console.log(`\n${label}: ${created} created, ${skipped} already existed, ${failed.length} failed`);
  if (failed.length > 0) {
    console.log(`  Failed ${label.toLowerCase()}:`);
    for (const f of failed) {
      console.log(`    - ${f.email}: ${f.error}`);
    }
  }
}

async function main() {
  console.log(
    `\n=== Demo account seed (${COMMIT ? "COMMIT -- writing to the database" : "DRY RUN -- no writes"}) ===`,
  );
  console.log(`Engineers: ${ENGINEER_COUNT}, Companies: ${COMPANY_COUNT}`);
  console.log(`Email domain: @${EMAIL_DOMAIN}`);
  // COMMIT already guarantees SEED_PASSWORD is set (checked above, before
  // main() runs) -- the placeholder branch only ever shows up in a dry run
  // where the operator hasn't set it yet. The actual value is used below to
  // build the account records but is deliberately never logged.
  const passwordForGeneration = SEED_PASSWORD ?? "(not set -- required for --commit)";
  console.log(
    `Shared password for every seeded account: ${SEED_PASSWORD ? "[set via SEED_ACCOUNT_PASSWORD, redacted]" : passwordForGeneration}`,
  );

  faker.seed(ENGINEER_SEED);
  const engineers = Array.from({ length: ENGINEER_COUNT }, (_, i) =>
    generateEngineerRecord(i + 1, passwordForGeneration),
  );

  faker.seed(COMPANY_SEED);
  const usedCompanyNames = new Set<string>();
  const companies = Array.from({ length: COMPANY_COUNT }, (_, i) =>
    generateCompanyRecord(i + 1, passwordForGeneration, usedCompanyNames),
  );

  // Sanity check: the deterministic email scheme must not collide with itself.
  const allEmails = [...engineers.map((e) => e.email), ...companies.map((c) => c.email)];
  const duplicateEmails = allEmails.filter((email, i) => allEmails.indexOf(email) !== i);
  if (duplicateEmails.length > 0) {
    throw new Error(
      `Generated duplicate emails, refusing to continue: ${[...new Set(duplicateEmails)].join(", ")}`,
    );
  }

  console.log("\n--- Sample Engineer records ---");
  for (const e of engineers.slice(0, 3)) {
    console.log(
      `  ${e.name} <${e.email}> | ${e.profile.prefecture} | ${e.profile.job_title} | ` +
        `skills: ${e.skills.map((s) => `${s.skillName}(Lv${s.level})`).join(", ")}`,
    );
  }

  console.log("\n--- Sample Company records ---");
  for (const c of companies.slice(0, 3)) {
    console.log(
      `  ${c.profile.company_name} <${c.email}> | ${c.profile.prefecture} | ` +
        `${c.profile.industry} | ${c.profile.company_size}名 | 担当: ${c.profile.contact_person}`,
    );
  }

  console.log(
    `\nTotal to create: ${engineers.length} engineers + ${companies.length} companies = ${
      engineers.length + companies.length
    } accounts.`,
  );

  if (!COMMIT) {
    console.log(
      "\nDry run only -- no Supabase calls were made. Re-run with --commit to actually create these accounts.",
    );
    return;
  }

  const supabase = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\nLoading master data (skills, industries)...");
  const [skillIdByName, industryIdByName] = await Promise.all([
    fetchNameToIdMap(supabase, "skills", TECHNICAL_SKILL_NAMES),
    fetchNameToIdMap(supabase, "industry_categories", INDUSTRY_NAMES),
  ]);

  console.log("Checking for already-seeded accounts (idempotency)...");
  const { data: existingRows, error: existingError } = await supabase
    .from("users")
    .select("email")
    .in("email", allEmails);
  if (existingError) {
    throw new Error(`Failed to check existing accounts: ${existingError.message}`);
  }
  const existingEmails = new Set((existingRows ?? []).map((row) => (row.email as string).toLowerCase()));

  const engineersToCreate = engineers.filter((e) => !existingEmails.has(e.email.toLowerCase()));
  const engineersSkipped = engineers.length - engineersToCreate.length;
  const companiesToCreate = companies.filter((c) => !existingEmails.has(c.email.toLowerCase()));
  const companiesSkipped = companies.length - companiesToCreate.length;

  console.log(
    `\nCreating ${engineersToCreate.length} engineers (${engineersSkipped} already existed)...`,
  );
  const engineerOutcomes: SeedOutcome[] = [
    ...Array.from({ length: engineersSkipped }, () => ({
      email: "",
      status: "skipped_existing" as const,
    })),
    ...(await mapWithConcurrency(engineersToCreate, 5, (record) =>
      createEngineer(supabase, record, skillIdByName),
    )),
  ];

  console.log(`Creating ${companiesToCreate.length} companies (${companiesSkipped} already existed)...`);
  const companyOutcomes: SeedOutcome[] = [
    ...Array.from({ length: companiesSkipped }, () => ({
      email: "",
      status: "skipped_existing" as const,
    })),
    ...(await mapWithConcurrency(companiesToCreate, 5, (record) =>
      createCompany(supabase, record, industryIdByName),
    )),
  ];

  summarize("Engineers", engineerOutcomes);
  summarize("Companies", companyOutcomes);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("\nSeed script failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
