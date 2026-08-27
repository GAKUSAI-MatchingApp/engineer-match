"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ItssBadge } from "@/components/engineer/profile/ItssBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import {
  INVALID_SKILL_NAME_ERROR,
  ITSS_SKILL_LEVELS,
  MAX_USER_SKILLS,
  MIN_USER_SKILLS,
  SKILL_LIMIT_MAX_ERROR,
  SKILL_LIMIT_MIN_ERROR,
  addUserSkill,
  createUserSkill,
  mapUserSkillRow,
  normalizeSkillName,
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
  const [catalogState, setCatalogState] = useState<SkillCatalogItem[]>(catalog);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atMaxSkills = skills.length >= MAX_USER_SKILLS;
  const atMinSkills = skills.length <= MIN_USER_SKILLS;
  const availableToAdd = atMaxSkills
    ? []
    : catalogState.filter((item) => !skills.some((skill) => skill.skillId === item.id));

  const [skillQuery, setSkillQuery] = useState<string>("");
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [newLevel, setNewLevel] = useState<number>(1);
  const [newExperienceYears, setNewExperienceYears] = useState<string>("");

  const trimmedQuery = skillQuery.trim();
  const normalizedQuery = normalizeSkillName(trimmedQuery);
  const exactCatalogMatch = trimmedQuery
    ? catalogState.find((item) => normalizeSkillName(item.name) === normalizedQuery)
    : undefined;
  const isExactMatchOwned = exactCatalogMatch
    ? skills.some((skill) => skill.skillId === exactCatalogMatch.id)
    : false;
  const showRegisterNewOption = trimmedQuery.length > 0 && !exactCatalogMatch;
  const filteredOptions = availableToAdd.filter(
    (item) => trimmedQuery === "" || item.name.toLowerCase().includes(normalizedQuery),
  );

  function selectSkillOption(name: string) {
    setSkillQuery(name);
    setIsSkillDropdownOpen(false);
  }

  async function handleAdd() {
    if (isSubmitting || atMaxSkills || !trimmedQuery) return;

    if (isExactMatchOwned) {
      setError(TECHNICAL_SKILL_EDITOR_LABELS.alreadyAddedError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const experienceYears = newExperienceYears.trim() ? Number(newExperienceYears) : null;
    const supabase = createClient();
    const { data, error: addError } = exactCatalogMatch
      ? await addUserSkill(supabase, userId, exactCatalogMatch.id, newLevel, experienceYears)
      : await createUserSkill(supabase, userId, trimmedQuery, newLevel, experienceYears);

    setIsSubmitting(false);

    if (addError || !data) {
      console.error("[technical-skills] add failed:", addError);
      const message = (addError as { message?: string } | null)?.message;
      setError(
        message === SKILL_LIMIT_MAX_ERROR
          ? TECHNICAL_SKILL_EDITOR_LABELS.limitMaxError
          : message === INVALID_SKILL_NAME_ERROR
            ? TECHNICAL_SKILL_EDITOR_LABELS.invalidSkillNameError
            : TECHNICAL_SKILL_EDITOR_LABELS.addError,
      );
      return;
    }

    const mapped = mapUserSkillRow(data);
    setSkills((prev) => [...prev, mapped]);
    if (!exactCatalogMatch) {
      setCatalogState((prev) => [...prev, { id: mapped.skillId, name: mapped.name, subcategoryName: "" }]);
    }
    setSkillQuery("");
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

      {skills.length > 0 && (
        <div
          aria-hidden="true"
          className="hidden items-center gap-3 px-3 text-xs font-medium text-muted-foreground sm:flex"
        >
          <span className="w-7 shrink-0" />
          <span className="min-w-32 flex-1">{TECHNICAL_SKILL_EDITOR_LABELS.skillLabel}</span>
          <span className="w-44">{TECHNICAL_SKILL_EDITOR_LABELS.levelLabel}</span>
          <span className="w-32">{TECHNICAL_SKILL_EDITOR_LABELS.experienceYearsLabel}</span>
          <span className="w-9 shrink-0" />
        </div>
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

      {!atMaxSkills ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border p-3">
          <div className="relative flex min-w-40 flex-1 flex-col gap-1.5">
            <Label htmlFor="new-skill-name">
              {TECHNICAL_SKILL_EDITOR_LABELS.skillLabel}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-skill-name"
              type="text"
              autoComplete="off"
              value={skillQuery}
              placeholder={TECHNICAL_SKILL_EDITOR_LABELS.skillNamePlaceholder}
              onChange={(event) => {
                setSkillQuery(event.target.value);
                setIsSkillDropdownOpen(true);
              }}
              onFocus={() => setIsSkillDropdownOpen(true)}
              onBlur={() => setIsSkillDropdownOpen(false)}
              className="h-9"
            />
            {isSkillDropdownOpen && (
              <div
                role="listbox"
                // onMouseDown here fires (and is cancelled) before the input's
                // onBlur, so clicking an option selects it instead of just
                // closing the dropdown out from under the click.
                onMouseDown={(event) => event.preventDefault()}
                className="absolute top-full left-0 z-40 mt-1 max-h-56 w-full min-w-56 overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-lg"
              >
                {filteredOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={normalizeSkillName(item.name) === normalizedQuery}
                    onClick={() => selectSkillOption(item.name)}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-foreground transition-colors duration-200 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    {item.subcategoryName ? `${item.name}（${item.subcategoryName}）` : item.name}
                  </button>
                ))}
                {showRegisterNewOption && (
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => setIsSkillDropdownOpen(false)}
                    className="flex w-full items-center gap-1.5 border-t border-border px-3 py-2 text-left text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {TECHNICAL_SKILL_EDITOR_LABELS.registerNewPrefix}
                    {trimmedQuery}
                    {TECHNICAL_SKILL_EDITOR_LABELS.registerNewSuffix}
                  </button>
                )}
                {filteredOptions.length === 0 && !showRegisterNewOption && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    {isExactMatchOwned
                      ? TECHNICAL_SKILL_EDITOR_LABELS.alreadyAddedError
                      : TECHNICAL_SKILL_EDITOR_LABELS.emptyCatalogMessage}
                  </p>
                )}
              </div>
            )}
            {!isSkillDropdownOpen && showRegisterNewOption && (
              <p className="text-xs text-primary">
                {TECHNICAL_SKILL_EDITOR_LABELS.registerNewPrefix}
                {trimmedQuery}
                {TECHNICAL_SKILL_EDITOR_LABELS.registerNewSuffix}
              </p>
            )}
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
            disabled={isSubmitting || !trimmedQuery || isExactMatchOwned}
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
          <p className="text-xs text-muted-foreground">{TECHNICAL_SKILL_EDITOR_LABELS.limitMaxError}</p>
        )
      )}

      <FormStatusMessage message={error} status={error ? "error" : null} />
    </fieldset>
  );
}
