"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ItssBadge } from "@/components/engineer/profile/ItssBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ITSS_SKILL_LEVELS,
  MAX_USER_SKILLS,
  MIN_USER_SKILLS,
  SKILL_LIMIT_MAX_ERROR,
  SKILL_LIMIT_MIN_ERROR,
  addUserSkill,
  removeUserSkill,
  updateUserSkillLevel,
  type SkillCatalogItem,
  type UserSkillItem,
} from "@/lib/engineer/skills";
import { createClient } from "@/lib/supabase/client";
import { TECHNICAL_SKILL_EDITOR_LABELS } from "@/constants/engineer-profile";
import { formatItssLevelOption } from "@/constants/skill-levels";

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface TechnicalSkillsManagerProps {
  userId: string;
  initialSkills: UserSkillItem[];
  catalog: SkillCatalogItem[];
}

export function TechnicalSkillsManager({
  userId,
  initialSkills,
  catalog,
}: TechnicalSkillsManagerProps) {
  const [skills, setSkills] = useState<UserSkillItem[]>(initialSkills);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atMaxSkills = skills.length >= MAX_USER_SKILLS;
  const atMinSkills = skills.length <= MIN_USER_SKILLS;
  const availableToAdd = atMaxSkills
    ? []
    : catalog.filter((item) => !skills.some((skill) => skill.skillId === item.id));
  const [newSkillId, setNewSkillId] = useState<string>(availableToAdd[0]?.id ?? "");
  const [newLevel, setNewLevel] = useState<number>(1);
  const [newExperienceYears, setNewExperienceYears] = useState<string>("");

  async function handleAdd() {
    if (isSubmitting || !newSkillId || atMaxSkills) return;
    setIsSubmitting(true);
    setError(null);

    const experienceYears = newExperienceYears.trim() ? Number(newExperienceYears) : null;
    const supabase = createClient();
    const { data, error: addError } = await addUserSkill(
      supabase,
      userId,
      newSkillId,
      newLevel,
      experienceYears,
    );

    setIsSubmitting(false);

    if (addError || !data) {
      console.error("[technical-skills] add failed:", addError);
      setError(
        (addError as { message?: string } | null)?.message === SKILL_LIMIT_MAX_ERROR
          ? TECHNICAL_SKILL_EDITOR_LABELS.limitMaxError
          : TECHNICAL_SKILL_EDITOR_LABELS.addError,
      );
      return;
    }

    const skillName = catalog.find((item) => item.id === newSkillId)?.name ?? "";
    const nextSkills = [
      ...skills,
      { id: data.id as string, skillId: newSkillId, name: skillName, level: newLevel, experienceYears },
    ];
    setSkills(nextSkills);
    const nextAvailable = catalog.filter(
      (item) => !nextSkills.some((skill) => skill.skillId === item.id),
    );
    setNewSkillId(nextAvailable[0]?.id ?? "");
    setNewLevel(1);
    setNewExperienceYears("");
  }

  async function handleLevelChange(userSkillId: string, level: number) {
    if (isSubmitting) return;
    const current = skills.find((skill) => skill.id === userSkillId);
    await handleFieldUpdate(userSkillId, level, current?.experienceYears ?? null);
  }

  async function handleExperienceYearsChange(userSkillId: string, experienceYears: number | null) {
    if (isSubmitting) return;
    const current = skills.find((skill) => skill.id === userSkillId);
    await handleFieldUpdate(userSkillId, current?.level ?? 1, experienceYears);
  }

  async function handleFieldUpdate(
    userSkillId: string,
    level: number,
    experienceYears: number | null,
  ) {
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await updateUserSkillLevel(
      supabase,
      userSkillId,
      level,
      experienceYears,
    );

    setIsSubmitting(false);

    if (updateError) {
      console.error("[technical-skills] update failed:", updateError);
      setError(TECHNICAL_SKILL_EDITOR_LABELS.updateError);
      return;
    }

    setSkills((prev) =>
      prev.map((skill) => (skill.id === userSkillId ? { ...skill, level, experienceYears } : skill)),
    );
  }

  async function handleRemove(userSkillId: string) {
    if (isSubmitting) return;
    if (atMinSkills) {
      setError(TECHNICAL_SKILL_EDITOR_LABELS.limitMinError);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: removeError } = await removeUserSkill(supabase, userSkillId, userId);

    setIsSubmitting(false);

    if (removeError) {
      console.error("[technical-skills] remove failed:", removeError);
      setError(
        (removeError as { message?: string }).message === SKILL_LIMIT_MIN_ERROR
          ? TECHNICAL_SKILL_EDITOR_LABELS.limitMinError
          : TECHNICAL_SKILL_EDITOR_LABELS.removeError,
      );
      return;
    }

    setSkills((prev) => prev.filter((skill) => skill.id !== userSkillId));
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-foreground">
        {TECHNICAL_SKILL_EDITOR_LABELS.skillLabel}
      </legend>

      <p className="text-xs text-muted-foreground">
        {skills.length}/{MAX_USER_SKILLS}
        {TECHNICAL_SKILL_EDITOR_LABELS.countSuffix}
      </p>

      {skills.length === 0 && (
        <p className="text-sm text-muted-foreground">{TECHNICAL_SKILL_EDITOR_LABELS.emptyMessage}</p>
      )}

      {skills.map((skill) => (
        <div
          key={skill.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
        >
          <ItssBadge level={(skill.level ?? 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7} size="sm" />
          <p className="min-w-32 flex-1 truncate text-sm font-semibold text-foreground">
            {skill.name}
          </p>
          <div className="flex w-44 flex-col gap-1">
            <Label htmlFor={`skill-level-${skill.id}`} className="sr-only">
              {TECHNICAL_SKILL_EDITOR_LABELS.levelLabel}
            </Label>
            <select
              id={`skill-level-${skill.id}`}
              value={skill.level ?? 1}
              disabled={isSubmitting}
              onChange={(event) => handleLevelChange(skill.id, Number(event.target.value))}
              className={SELECT_CLASS}
            >
              {ITSS_SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {formatItssLevelOption(level)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-32 flex-col gap-1">
            <Label htmlFor={`skill-years-${skill.id}`} className="sr-only">
              {TECHNICAL_SKILL_EDITOR_LABELS.experienceYearsLabel}
            </Label>
            <Input
              id={`skill-years-${skill.id}`}
              type="number"
              min={0}
              max={50}
              disabled={isSubmitting}
              value={skill.experienceYears ?? ""}
              placeholder={TECHNICAL_SKILL_EDITOR_LABELS.experienceYearsLabel}
              onChange={(event) =>
                handleExperienceYearsChange(
                  skill.id,
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              className="h-9"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemove(skill.id)}
            disabled={isSubmitting || atMinSkills}
            title={atMinSkills ? TECHNICAL_SKILL_EDITOR_LABELS.limitMinError : undefined}
            aria-label={`${TECHNICAL_SKILL_EDITOR_LABELS.removeLabel}：${skill.name}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}

      {availableToAdd.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border p-3">
          <div className="flex min-w-40 flex-1 flex-col gap-1.5">
            <Label htmlFor="new-skill-name">{TECHNICAL_SKILL_EDITOR_LABELS.skillLabel}</Label>
            <select
              id="new-skill-name"
              value={newSkillId}
              onChange={(event) => setNewSkillId(event.target.value)}
              className={SELECT_CLASS}
            >
              {availableToAdd.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.subcategoryName ? `${item.name}（${item.subcategoryName}）` : item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-44 flex-col gap-1.5">
            <Label htmlFor="new-skill-level">{TECHNICAL_SKILL_EDITOR_LABELS.levelLabel}</Label>
            <select
              id="new-skill-level"
              value={newLevel}
              onChange={(event) => setNewLevel(Number(event.target.value))}
              className={SELECT_CLASS}
            >
              {ITSS_SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {formatItssLevelOption(level)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-32 flex-col gap-1.5">
            <Label htmlFor="new-skill-years">{TECHNICAL_SKILL_EDITOR_LABELS.experienceYearsLabel}</Label>
            <Input
              id="new-skill-years"
              type="number"
              min={0}
              max={50}
              value={newExperienceYears}
              onChange={(event) => setNewExperienceYears(event.target.value)}
              className="h-9"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isSubmitting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {TECHNICAL_SKILL_EDITOR_LABELS.addLabel}
          </button>
        </div>
      ) : (
        skills.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {atMaxSkills
              ? TECHNICAL_SKILL_EDITOR_LABELS.limitMaxError
              : TECHNICAL_SKILL_EDITOR_LABELS.emptyCatalogMessage}
          </p>
        )
      )}

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </fieldset>
  );
}
