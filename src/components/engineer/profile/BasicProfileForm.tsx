"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import { saveEngineerProfile, updateUserName, type EngineerProfile } from "@/lib/engineer/profile";
import {
  AVAILABILITY_STATUS_OPTIONS,
  BASIC_INFO_FORM_FIELDS,
  BASIC_INFO_FORM_META,
  JOB_CATEGORY_OPTIONS,
  VISIBILITY_FORM_LABEL,
  VISIBILITY_OPTIONS,
  WORK_STYLE_OPTIONS,
} from "@/constants/engineer-profile";

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface BasicProfileFormProps {
  userId: string;
  initialName: string;
  email: string;
  profile: EngineerProfile | null;
}

interface FormState {
  name: string;
  jobTitle: string;
  jobCategory: string;
  prefecture: string;
  yearsOfExperience: string;
  availabilityStatus: string;
  workStyle: string;
  desiredRateMin: string;
  desiredRateMax: string;
  desiredAnnualIncomeMin: string;
  desiredAnnualIncomeMax: string;
  desiredHourlyRateMin: string;
  desiredHourlyRateMax: string;
  availableFrom: string;
  portfolioUrl: string;
  githubUrl: string;
  selfPr: string;
  isPublic: boolean;
}

function buildFormState(name: string, profile: EngineerProfile | null): FormState {
  return {
    name,
    jobTitle: profile?.job_title ?? "",
    jobCategory: profile?.job_category ?? "",
    prefecture: profile?.prefecture ?? "",
    yearsOfExperience:
      profile?.years_of_experience !== null && profile?.years_of_experience !== undefined
        ? String(profile.years_of_experience)
        : "",
    availabilityStatus: profile?.availability_status ?? "",
    workStyle: profile?.work_style ?? "",
    desiredRateMin: profile?.desired_rate_min ? String(profile.desired_rate_min) : "",
    desiredRateMax: profile?.desired_rate_max ? String(profile.desired_rate_max) : "",
    desiredAnnualIncomeMin: profile?.desired_annual_income_min
      ? String(profile.desired_annual_income_min)
      : "",
    desiredAnnualIncomeMax: profile?.desired_annual_income_max
      ? String(profile.desired_annual_income_max)
      : "",
    desiredHourlyRateMin: profile?.desired_hourly_rate_min
      ? String(profile.desired_hourly_rate_min)
      : "",
    desiredHourlyRateMax: profile?.desired_hourly_rate_max
      ? String(profile.desired_hourly_rate_max)
      : "",
    availableFrom: profile?.available_from ?? "",
    portfolioUrl: profile?.portfolio_url ?? "",
    githubUrl: profile?.github_url ?? "",
    selfPr: profile?.self_pr ?? "",
    isPublic: profile?.is_public ?? true,
  };
}

export function BasicProfileForm({ userId, initialName, email, profile }: BasicProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildFormState(initialName, profile));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"error" | "success" | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setMessage(null);
    setStatus(null);

    const name = form.name.trim();
    if (!name) {
      setMessage(BASIC_INFO_FORM_META.nameRequired);
      setStatus("error");
      return;
    }

    // RD 4.2.6: 居住地・経験年数・希望の働き方・希望単価 are required fields.
    // Existing legacy profiles saved before this rule (including QA rows
    // with 0 skills / empty fields) are read/displayed unchanged -- this
    // only gates new saves, never rewrites a row the user didn't touch.
    const prefecture = form.prefecture.trim();
    if (!prefecture) {
      setMessage(BASIC_INFO_FORM_META.prefectureRequired);
      setStatus("error");
      return;
    }

    if (!form.yearsOfExperience.trim()) {
      setMessage(BASIC_INFO_FORM_META.yearsOfExperienceRequired);
      setStatus("error");
      return;
    }
    const yearsOfExperience = Number(form.yearsOfExperience);
    if (!Number.isInteger(yearsOfExperience) || yearsOfExperience < 0 || yearsOfExperience > 50) {
      setMessage(BASIC_INFO_FORM_META.invalidYearsOfExperience);
      setStatus("error");
      return;
    }

    if (!form.workStyle) {
      setMessage(BASIC_INFO_FORM_META.workStyleRequired);
      setStatus("error");
      return;
    }

    if (!form.desiredRateMin.trim() || !form.desiredRateMax.trim()) {
      setMessage(BASIC_INFO_FORM_META.desiredRateRequired);
      setStatus("error");
      return;
    }
    const desiredRateMin = Number(form.desiredRateMin);
    const desiredRateMax = Number(form.desiredRateMax);
    if (
      !Number.isInteger(desiredRateMin) ||
      desiredRateMin < 1 ||
      desiredRateMin > 999 ||
      !Number.isInteger(desiredRateMax) ||
      desiredRateMax < 1 ||
      desiredRateMax > 999
    ) {
      setMessage(BASIC_INFO_FORM_META.invalidRate);
      setStatus("error");
      return;
    }
    if (desiredRateMin > desiredRateMax) {
      setMessage(BASIC_INFO_FORM_META.invalidRateOrder);
      setStatus("error");
      return;
    }

    let desiredAnnualIncomeMin: number | null = null;
    if (form.desiredAnnualIncomeMin.trim()) {
      const parsed = Number(form.desiredAnnualIncomeMin);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999) {
        setMessage(BASIC_INFO_FORM_META.invalidAnnualIncome);
        setStatus("error");
        return;
      }
      desiredAnnualIncomeMin = parsed;
    }

    let desiredAnnualIncomeMax: number | null = null;
    if (form.desiredAnnualIncomeMax.trim()) {
      const parsed = Number(form.desiredAnnualIncomeMax);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999) {
        setMessage(BASIC_INFO_FORM_META.invalidAnnualIncome);
        setStatus("error");
        return;
      }
      desiredAnnualIncomeMax = parsed;
    }

    if (
      desiredAnnualIncomeMin !== null &&
      desiredAnnualIncomeMax !== null &&
      desiredAnnualIncomeMin > desiredAnnualIncomeMax
    ) {
      setMessage(BASIC_INFO_FORM_META.invalidAnnualIncomeOrder);
      setStatus("error");
      return;
    }

    let desiredHourlyRateMin: number | null = null;
    if (form.desiredHourlyRateMin.trim()) {
      const parsed = Number(form.desiredHourlyRateMin);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99999) {
        setMessage(BASIC_INFO_FORM_META.invalidHourlyRate);
        setStatus("error");
        return;
      }
      desiredHourlyRateMin = parsed;
    }

    let desiredHourlyRateMax: number | null = null;
    if (form.desiredHourlyRateMax.trim()) {
      const parsed = Number(form.desiredHourlyRateMax);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99999) {
        setMessage(BASIC_INFO_FORM_META.invalidHourlyRate);
        setStatus("error");
        return;
      }
      desiredHourlyRateMax = parsed;
    }

    if (
      desiredHourlyRateMin !== null &&
      desiredHourlyRateMax !== null &&
      desiredHourlyRateMin > desiredHourlyRateMax
    ) {
      setMessage(BASIC_INFO_FORM_META.invalidHourlyRateOrder);
      setStatus("error");
      return;
    }

    if (form.selfPr.length > 2000) {
      setMessage(BASIC_INFO_FORM_META.invalidSelfPr);
      setStatus("error");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();

      const [{ error: nameError }, { error: profileError }] = await Promise.all([
        name !== initialName ? updateUserName(supabase, userId, name) : Promise.resolve({ error: null }),
        saveEngineerProfile(supabase, userId, {
          prefecture,
          years_of_experience: yearsOfExperience,
          self_pr: form.selfPr.trim() || null,
          work_style: (form.workStyle || null) as EngineerProfile["work_style"],
          desired_rate_min: desiredRateMin,
          desired_rate_max: desiredRateMax,
          portfolio_url: form.portfolioUrl.trim() || null,
          is_public: form.isPublic,
          job_title: form.jobTitle.trim() || null,
          job_category: (form.jobCategory || null) as EngineerProfile["job_category"],
          availability_status: (form.availabilityStatus || null) as EngineerProfile["availability_status"],
          github_url: form.githubUrl.trim() || null,
          desired_annual_income_min: desiredAnnualIncomeMin,
          desired_annual_income_max: desiredAnnualIncomeMax,
          desired_hourly_rate_min: desiredHourlyRateMin,
          desired_hourly_rate_max: desiredHourlyRateMax,
          available_from: form.availableFrom || null,
        }),
      ]);

      if (nameError || profileError) {
        console.error("[engineer-profile] save failed:", nameError ?? profileError);
        setMessage(BASIC_INFO_FORM_META.saveFailedMessage);
        setStatus("error");
        return;
      }

      setMessage(BASIC_INFO_FORM_META.savedMessage);
      setStatus("success");
      router.refresh();
    } catch (err) {
      console.error("[engineer-profile] unexpected save error:", err);
      setMessage(BASIC_INFO_FORM_META.saveFailedMessage);
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-name">{BASIC_INFO_FORM_FIELDS.name.label}</Label>
          <Input
            id="basic-name"
            type="text"
            value={form.name}
            placeholder={BASIC_INFO_FORM_FIELDS.name.placeholder}
            onChange={(event) => updateField("name", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-email">メールアドレス</Label>
          <Input id="basic-email" type="email" value={email} disabled className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-job-title">{BASIC_INFO_FORM_FIELDS.jobTitle.label}</Label>
          <Input
            id="basic-job-title"
            type="text"
            value={form.jobTitle}
            placeholder={BASIC_INFO_FORM_FIELDS.jobTitle.placeholder}
            onChange={(event) => updateField("jobTitle", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-job-category">{BASIC_INFO_FORM_FIELDS.jobCategory.label}</Label>
          <select
            id="basic-job-category"
            value={form.jobCategory}
            onChange={(event) => updateField("jobCategory", event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">選択してください</option>
            {JOB_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-prefecture">
            {BASIC_INFO_FORM_FIELDS.prefecture.label}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="basic-prefecture"
            type="text"
            value={form.prefecture}
            placeholder={BASIC_INFO_FORM_FIELDS.prefecture.placeholder}
            onChange={(event) => updateField("prefecture", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-years">
            {BASIC_INFO_FORM_FIELDS.yearsOfExperience.label}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="basic-years"
            type="number"
            inputMode="numeric"
            min={0}
            max={50}
            placeholder={BASIC_INFO_FORM_FIELDS.yearsOfExperience.placeholder}
            value={form.yearsOfExperience}
            onChange={(event) => updateField("yearsOfExperience", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-availability-status">{BASIC_INFO_FORM_FIELDS.availabilityStatus.label}</Label>
          <select
            id="basic-availability-status"
            value={form.availabilityStatus}
            onChange={(event) => updateField("availabilityStatus", event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">選択してください</option>
            {AVAILABILITY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-work-style">
            {BASIC_INFO_FORM_FIELDS.workStyle.label}
            <span className="text-destructive">*</span>
          </Label>
          <select
            id="basic-work-style"
            value={form.workStyle}
            onChange={(event) => updateField("workStyle", event.target.value)}
            className={SELECT_CLASS}
            required
          >
            <option value="">選択してください</option>
            {WORK_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-portfolio-url">{BASIC_INFO_FORM_FIELDS.portfolioUrl.label}</Label>
          <Input
            id="basic-portfolio-url"
            type="url"
            value={form.portfolioUrl}
            placeholder={BASIC_INFO_FORM_FIELDS.portfolioUrl.placeholder}
            onChange={(event) => updateField("portfolioUrl", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-github-url">{BASIC_INFO_FORM_FIELDS.githubUrl.label}</Label>
          <Input
            id="basic-github-url"
            type="url"
            value={form.githubUrl}
            placeholder={BASIC_INFO_FORM_FIELDS.githubUrl.placeholder}
            onChange={(event) => updateField("githubUrl", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-available-from">{BASIC_INFO_FORM_FIELDS.availableFrom.label}</Label>
          <Input
            id="basic-available-from"
            type="date"
            value={form.availableFrom}
            onChange={(event) => updateField("availableFrom", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-rate-min">
            {BASIC_INFO_FORM_FIELDS.desiredRateMin.label}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="basic-rate-min"
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            placeholder={BASIC_INFO_FORM_FIELDS.desiredRateMin.placeholder}
            value={form.desiredRateMin}
            onChange={(event) => updateField("desiredRateMin", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-rate-max">
            {BASIC_INFO_FORM_FIELDS.desiredRateMax.label}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="basic-rate-max"
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            placeholder={BASIC_INFO_FORM_FIELDS.desiredRateMax.placeholder}
            value={form.desiredRateMax}
            onChange={(event) => updateField("desiredRateMax", event.target.value)}
            className="h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-annual-income-min">{BASIC_INFO_FORM_FIELDS.desiredAnnualIncomeMin.label}</Label>
          <Input
            id="basic-annual-income-min"
            type="number"
            inputMode="numeric"
            min={1}
            max={9999}
            placeholder={BASIC_INFO_FORM_FIELDS.desiredAnnualIncomeMin.placeholder}
            value={form.desiredAnnualIncomeMin}
            onChange={(event) => updateField("desiredAnnualIncomeMin", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-annual-income-max">{BASIC_INFO_FORM_FIELDS.desiredAnnualIncomeMax.label}</Label>
          <Input
            id="basic-annual-income-max"
            type="number"
            inputMode="numeric"
            min={1}
            max={9999}
            placeholder={BASIC_INFO_FORM_FIELDS.desiredAnnualIncomeMax.placeholder}
            value={form.desiredAnnualIncomeMax}
            onChange={(event) => updateField("desiredAnnualIncomeMax", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-hourly-rate-min">{BASIC_INFO_FORM_FIELDS.desiredHourlyRateMin.label}</Label>
          <Input
            id="basic-hourly-rate-min"
            type="number"
            inputMode="numeric"
            min={1}
            max={99999}
            placeholder={BASIC_INFO_FORM_FIELDS.desiredHourlyRateMin.placeholder}
            value={form.desiredHourlyRateMin}
            onChange={(event) => updateField("desiredHourlyRateMin", event.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basic-hourly-rate-max">{BASIC_INFO_FORM_FIELDS.desiredHourlyRateMax.label}</Label>
          <Input
            id="basic-hourly-rate-max"
            type="number"
            inputMode="numeric"
            min={1}
            max={99999}
            placeholder={BASIC_INFO_FORM_FIELDS.desiredHourlyRateMax.placeholder}
            value={form.desiredHourlyRateMax}
            onChange={(event) => updateField("desiredHourlyRateMax", event.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="basic-self-pr">{BASIC_INFO_FORM_FIELDS.selfPr.label}</Label>
        <Textarea
          id="basic-self-pr"
          value={form.selfPr}
          onChange={(event) => updateField("selfPr", event.target.value)}
          maxLength={2000}
          rows={5}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm leading-none font-medium">{VISIBILITY_FORM_LABEL}</span>
        <RadioGroup
          value={String(form.isPublic)}
          onValueChange={(value) => updateField("isPublic", value === "true")}
          aria-label={VISIBILITY_FORM_LABEL}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <label
              key={String(option.value)}
              htmlFor={`visibility-${option.value}`}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
            >
              <RadioGroupItem value={String(option.value)} id={`visibility-${option.value}`} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      {message && (
        <div
          role="alert"
          aria-live="assertive"
          className={
            status === "success"
              ? "rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
              : "rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          }
        >
          {message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSaving ? BASIC_INFO_FORM_META.savingLabel : BASIC_INFO_FORM_META.saveLabel}
        </button>
      </div>
    </form>
  );
}
