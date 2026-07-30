/**
 * Canonical skill-level label formatting shared across every user-facing
 * ITSS (Technical, 1-7) and diagnosis (Human/Business, 1-5) display.
 *
 * ITSS titles are NOT redefined here -- they come from ITSS_LEVELS
 * (constants/lp.ts), which mirrors the admin-editable public.skill_levels
 * table (033_skill_qualification_master_data.sql, edited via Admin >
 * マスタ管理 > ITSSレベル). Inventing different wording here would
 * desync the badges/dropdowns from what an admin sees and can edit,
 * without a migration to keep them in sync -- so this module only adds
 * consistent formatting on top of the existing titles. Diagnosis (1-5)
 * titles have no DB/admin-editable counterpart (skill_assessment_attempts
 * stores only the numeric level), so that wording is defined here directly.
 *
 * No DB values, scoring, or calculations are touched by this module.
 */
import { ITSS_LEVELS } from "@/constants/lp";

export type ItssLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DiagnosisLevel = 1 | 2 | 3 | 4 | 5;

const ITSS_TITLE_BY_LEVEL = new Map<number, string>(
  ITSS_LEVELS.map((item) => [item.level, item.title]),
);

/** Full admin-editable title, e.g. "エントリレベル". */
export function itssLevelTitle(level: ItssLevel): string {
  return ITSS_TITLE_BY_LEVEL.get(level) ?? "";
}

/** Existing titles all end in "レベル" (e.g. "エントリレベル") -- trimmed so composite labels like "レベル1｜エントリ" don't repeat the word. */
function shortItssTitle(level: ItssLevel): string {
  return itssLevelTitle(level).replace(/レベル$/, "");
}

/** "レベル1｜エントリ" -- badges, summaries, detail displays. */
export function formatItssLevelLabel(level: ItssLevel): string {
  const title = shortItssTitle(level);
  return title ? `レベル${level}｜${title}` : `レベル${level}`;
}

/** "L1｜エントリ" -- space-constrained badges/chips. */
export function formatItssLevelLabelShort(level: ItssLevel): string {
  const title = shortItssTitle(level);
  return title ? `L${level}｜${title}` : `L${level}`;
}

/** "レベル1（エントリ）" -- dropdown/select option text. */
export function formatItssLevelOption(level: ItssLevel): string {
  const title = shortItssTitle(level);
  return title ? `レベル${level}（${title}）` : `レベル${level}`;
}

/** Human/Business diagnosis (skill_assessment_attempts.final_level, 030/031_*.sql) has no stored title -- defined here as pure display text. */
export const DIAGNOSIS_LEVEL_TITLES: Record<DiagnosisLevel, string> = {
  1: "低い",
  2: "やや低い",
  3: "標準",
  4: "高い",
  5: "非常に高い",
};

export function diagnosisLevelTitle(level: DiagnosisLevel): string {
  return DIAGNOSIS_LEVEL_TITLES[level];
}

/** "診断レベル3｜標準" -- assessment result headline, skill cards, applicant/engineer detail views. */
export function formatDiagnosisLevelLabel(level: DiagnosisLevel): string {
  return `診断レベル${level}｜${diagnosisLevelTitle(level)}`;
}

/** Natural-language result wording per level, replacing the internal yes数換算/積み上げ式 explanation. Scoring itself (computeAssessmentScore) is unchanged -- this only rewords the message shown for the resulting finalLevel. */
export const DIAGNOSIS_RESULT_MESSAGES: Record<DiagnosisLevel, string> = {
  5: "非常に高い水準で実践できています。",
  4: "高い水準で安定して実践できています。",
  3: "標準的な水準で実践できています。",
  2: "改善の余地があります。",
  1: "基礎から強化していくことをおすすめします。",
};

export function formatDiagnosisResultMessage(level: DiagnosisLevel): string {
  return DIAGNOSIS_RESULT_MESSAGES[level];
}
