import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase's untyped client (no generated schema types in this project) can't
 * determine embedded-resource cardinality, so a to-one join types as an array
 * even though PostgREST returns a single object at runtime for a many-to-one
 * FK. Mirrors firstEmbedded() in src/lib/company/applicants.ts.
 */
function firstEmbedded<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** public.skills joined with its category/subcategory, per 003_master_tables.sql. */
export interface SkillCatalogItem {
  id: string;
  name: string;
  subcategoryName: string;
}

/** Active technical skills only -- skills_select_active RLS (022_master_table_policies.sql). */
export async function listSkillCatalog(supabase: SupabaseClient): Promise<SkillCatalogItem[]> {
  const { data, error } = await supabase
    .from("skills")
    .select("id, name, display_order, skill_subcategories(name)")
    .order("display_order");

  if (error) {
    console.error("[engineer-skills] failed to list skill catalog:", error);
    return [];
  }

  return ((data ?? []) as { id: string; name: string; skill_subcategories: unknown }[]).map(
    (row) => ({
      id: row.id,
      name: row.name,
      subcategoryName:
        firstEmbedded(row.skill_subcategories as { name: string } | { name: string }[])?.name ??
        "",
    }),
  );
}

/** ITSS level 1-7, per skill_levels (003_master_tables.sql). Never 1-5 -- Technical Skills are not Human/Business ratings. */
export const ITSS_SKILL_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;

export interface UserSkillItem {
  id: string; // user_skills.id
  skillId: string;
  name: string;
  level: number | null;
  /** 経験年数, per 042_user_skills_experience_years.sql. */
  experienceYears: number | null;
}

const USER_SKILL_SELECT = "id, skill_id, skill_level, experience_years, skills(name)";

/** The caller's own technical skills -- user_skills_select_own RLS (029_remaining_policies.sql). */
export async function listUserSkills(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSkillItem[]> {
  const { data, error } = await supabase
    .from("user_skills")
    .select(USER_SKILL_SELECT)
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    console.error("[engineer-skills] failed to list user skills:", error);
    return [];
  }

  return (
    (data ?? []) as {
      id: string;
      skill_id: string;
      skill_level: number | null;
      experience_years: number | null;
      skills: unknown;
    }[]
  ).map((row) => ({
    id: row.id,
    skillId: row.skill_id,
    name: firstEmbedded(row.skills as { name: string } | { name: string }[])?.name ?? "",
    level: row.skill_level,
    experienceYears: row.experience_years,
  }));
}

export const MAX_USER_SKILLS = 20;
export const MIN_USER_SKILLS = 1;

/** Distinguishable from a real Postgres error so the UI can show a specific message rather than a generic "add/remove failed". */
export const SKILL_LIMIT_MAX_ERROR = "skill_limit_max";
export const SKILL_LIMIT_MIN_ERROR = "skill_limit_min";

async function countUserSkills(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from("user_skills")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

/**
 * Adds one technical skill at the given ITSS level. Duplicate (user_id,
 * skill_id) pairs are rejected by uq_user_skills (015_user_skills.sql) --
 * callers should also filter the catalog to already-owned skills client-side
 * for a friendlier UX, but the DB constraint is the real guarantee.
 *
 * RD 4.2.6: max 20 skills. There is no DB CHECK for a per-user row count
 * (not expressible as a plain column constraint, and a trigger would risk
 * touching this table's existing-row behavior more than this phase calls
 * for) -- re-checking the count here, server-side, immediately before the
 * insert is what actually keeps a bypassed/direct API call from exceeding
 * the limit, not just the UI disabling the "add" control at 20.
 */
export async function addUserSkill(
  supabase: SupabaseClient,
  userId: string,
  skillId: string,
  level: number,
  experienceYears: number | null,
) {
  const currentCount = await countUserSkills(supabase, userId);
  if (currentCount >= MAX_USER_SKILLS) {
    return { data: null, error: { message: SKILL_LIMIT_MAX_ERROR } };
  }

  return supabase
    .from("user_skills")
    .insert({ user_id: userId, skill_id: skillId, skill_level: level, experience_years: experienceYears })
    .select(USER_SKILL_SELECT)
    .single();
}

export async function updateUserSkillLevel(
  supabase: SupabaseClient,
  userSkillId: string,
  level: number,
  experienceYears: number | null,
) {
  return supabase
    .from("user_skills")
    .update({ skill_level: level, experience_years: experienceYears })
    .eq("id", userSkillId)
    .select(USER_SKILL_SELECT)
    .single();
}

/**
 * RD 4.2.6: min 1 skill -- this is the incremental add/remove UI's only
 * "0-skill save" boundary (there is no separate profile-finalize step), so
 * the guard belongs here: removing a user's last remaining skill is refused
 * server-side, not just by disabling the UI's delete button.
 */
export async function removeUserSkill(
  supabase: SupabaseClient,
  userSkillId: string,
  userId: string,
) {
  const currentCount = await countUserSkills(supabase, userId);
  if (currentCount <= MIN_USER_SKILLS) {
    return { error: { message: SKILL_LIMIT_MIN_ERROR } };
  }

  return supabase.from("user_skills").delete().eq("id", userSkillId);
}
